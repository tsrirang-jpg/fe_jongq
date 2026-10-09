import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

type Props = { pathname: string }
export default function AdminNavigation({ pathname }: Props) {
  const { admin, isAuthenticated, logout, error } = useAuth()
  const [busy, setBusy] = useState(false)
  if (!isAuthenticated) return null
  const homeActive = pathname === '/' || pathname === '/user'
  return <header className="admin-navigation">
    <nav className="admin-tabs" aria-label="เมนูหลัก">
      <a href="/" className={homeActive ? 'active' : ''} aria-current={homeActive ? 'page' : undefined}>Home</a>
      <a href="/admin" className={pathname === '/admin' ? 'active' : ''} aria-current={pathname === '/admin' ? 'page' : undefined}>Admin</a>
    </nav>
    <div className="admin-account">
      <span>{admin?.username}</span>
      <button type="button" className="secondary" disabled={busy} onClick={async () => {
        setBusy(true); await logout(); setBusy(false)
      }}>{busy ? 'กำลังออก…' : 'ออกจากระบบ'}</button>
      {error && <p className="login-error" role="alert">{error}</p>}
    </div>
  </header>
}
