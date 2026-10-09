export interface AdminSession {
  username: string
  role: 'admin'
  expiresAt: number
}
export type LoginResult = { ok: true } | { ok: false; error: string }
