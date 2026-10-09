export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}
type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; notifyUnauthorized?: boolean }
const pendingGets = new Map<string, Promise<unknown>>()
let mutationQueue: Promise<unknown> = Promise.resolve()
export function api<T>(path: string, options: Options = {}): Promise<T> {
  if ((options.method ?? 'GET') !== 'GET') {
    const request = mutationQueue.then(() => send<T>(path, options))
    mutationQueue = request.catch(() => undefined)
    return request
  }
  const key = `${path}:${options.notifyUnauthorized ?? true}`
  const existing = pendingGets.get(key)
  if (existing) return existing as Promise<T>
  const request = send<T>(path, options).finally(() => {
    if (pendingGets.get(key) === request) pendingGets.delete(key)
  })
  pendingGets.set(key, request)
  return request
}
async function send<T>(path: string, { method = 'GET', body, notifyUnauthorized = true }: Options): Promise<T> {
  const signal = AbortSignal.timeout(15_000)
  const headers: Record<string, string> = {}
  try {
    if (method !== 'GET') {
      const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'include', cache: 'no-store', signal })
      if (!csrfResponse.ok) throw new ApiError('ไม่สามารถเริ่มคำขอได้ กรุณาลองอีกครั้ง', csrfResponse.status)
      const csrf: { token: string; headerName: string } = await csrfResponse.json()
      headers[csrf.headerName] = csrf.token
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const response = await fetch(`/api${path}`, {
      method, headers, credentials: 'include', cache: 'no-store', signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) {
      if (response.status === 401 && notifyUnauthorized) window.dispatchEvent(new Event('auth-expired'))
      const payload = await response.json().catch(() => null)
      throw new ApiError(payload?.message ?? 'ไม่สามารถทำรายการได้ กรุณาลองอีกครั้ง', response.status)
    }
    return response.status === 204 ? undefined as T : await response.json() as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (signal.aborted) throw new ApiError('เซิร์ฟเวอร์ไม่ตอบกลับ กรุณาลองเข้าสู่ระบบอีกครั้ง', 408)
    throw new ApiError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่า backend กำลังทำงาน', 0)
  }
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'
}
