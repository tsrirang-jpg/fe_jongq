import LoginForm from '../components/auth/LoginForm'
import Icon from '../components/common/Icon'
import { useAuth } from '../hooks/useAuth'

export default function AdminLoginPage() {
  const { loading, error, refreshSession } = useAuth()
  return <main className="page login-page">
    <section className="panel login-panel" aria-labelledby="login-title">
      <header className="brand"><Icon kind="scissors" /><div><h2>BARBER BOOKING</h2><p>ระบบจัดการสำหรับแอดมิน</p></div></header>
      <h1 id="login-title">เข้าสู่ระบบแอดมิน</h1>
      <p className="login-description">เข้าสู่ระบบเพื่อดูและจัดการคิวการจอง</p>
      {loading && <p className="hint" role="status">กำลังเชื่อมต่อระบบ กรุณารอสักครู่…</p>}
      {error && <div className="api-notice"><p className="login-error" role="alert">{error}</p>
        <button type="button" className="secondary" onClick={() => void refreshSession()}>ลองเชื่อมต่อใหม่</button>
      </div>}
      <LoginForm />
      <a href="/" className="back-home">กลับหน้า Home</a>
    </section>
  </main>
}
