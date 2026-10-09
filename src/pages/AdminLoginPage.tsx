import LoginForm from '../components/auth/LoginForm'
import Icon from '../components/common/Icon'

export default function AdminLoginPage() {
  return <main className="page login-page">
    <section className="panel login-panel" aria-labelledby="login-title">
      <header className="brand"><Icon kind="scissors" /><div><h2>BARBER BOOKING</h2><p>ระบบจัดการสำหรับแอดมิน</p></div></header>
      <h1 id="login-title">เข้าสู่ระบบแอดมิน</h1>
      <p className="login-description">เข้าสู่ระบบเพื่อดูและจัดการคิวการจอง</p>
      <LoginForm />
      <a href="/" className="back-home">กลับหน้า Home</a>
    </section>
  </main>
}
