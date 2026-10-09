import { api, ApiError, errorMessage } from './api'
import type { AdminSession, LoginResult } from '../types/auth'

type AuthSnapshot = { admin: AdminSession | null; loading: boolean; error: string | null }
let snapshot: AuthSnapshot = { admin: null, loading: true, error: null }
let generation = 0
let changingSession = false
let expiryTimer: number | undefined
let channel: BroadcastChannel | undefined
const listeners = new Set<() => void>()
export const getAuthSnapshot = () => snapshot
function scheduleSessionCheck() {
  window.clearTimeout(expiryTimer)
  if (snapshot.admin && listeners.size) {
    expiryTimer = window.setTimeout(() => { void refreshSession() }, Math.max(100, snapshot.admin.expiresAt - Date.now() + 100))
  }
}
function publish(next: AuthSnapshot) {
  snapshot = next
  scheduleSessionCheck()
  listeners.forEach(listener => listener())
}
export async function refreshSession() {
  if (changingSession) return
  const request = ++generation
  try {
    const admin = await api<AdminSession>('/auth/me', { notifyUnauthorized: false })
    if (request === generation) publish({ admin, loading: false, error: null })
  } catch (error) {
    if (request !== generation) return
    publish({ admin: null, loading: false, error: error instanceof ApiError && error.status === 401 ? null : errorMessage(error) })
  }
}
function expired() {
  generation++
  publish({ admin: null, loading: false, error: null })
}
function onVisibility() {
  if (document.visibilityState === 'visible' && snapshot.admin && snapshot.admin.expiresAt <= Date.now()) {
    void refreshSession()
  }
}
export function subscribeAuth(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    void refreshSession()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('auth-expired', expired)
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('jongq-auth-changes')
      channel.onmessage = event => {
        if (event.data === 'auth-changed') void refreshSession()
      }
    }
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      window.clearTimeout(expiryTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('auth-expired', expired)
      channel?.close()
      channel = undefined
    }
  }
}
export async function login(username: string, password: string): Promise<LoginResult> {
  changingSession = true
  const request = ++generation
  try {
    const admin = await api<AdminSession>('/auth/login', { method: 'POST', body: { username: username.trim(), password }, notifyUnauthorized: false })
    if (request === generation) publish({ admin, loading: false, error: null })
    channel?.postMessage('auth-changed')
    return { ok: true }
  } catch (error) {
    const message = error instanceof ApiError && error.status === 401
      ? 'รหัสผ่านไม่ถูกต้อง'
      : errorMessage(error)
    return { ok: false, error: message }
  }
  finally { changingSession = false }
}
export async function logout() {
  changingSession = true
  generation++
  try {
    await api<void>('/auth/logout', { method: 'POST' })
    expired()
    channel?.postMessage('auth-changed')
  } catch (error) { publish({ ...snapshot, error: errorMessage(error) }) }
  finally { changingSession = false }
}