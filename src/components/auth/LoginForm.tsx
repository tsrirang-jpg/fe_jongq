import { useLoginForm } from '../../hooks/useLoginForm'

export default function LoginForm() {
  const form = useLoginForm()
  return <form className="login-form" onSubmit={form.submit}>
    <label htmlFor="username">ชื่อผู้ใช้</label>
    <input id="username" name="username" value={form.username} onChange={event => form.changeUsername(event.target.value)}
      autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="กรอกชื่อผู้ใช้" maxLength={80} required
      aria-invalid={!!form.error} aria-describedby={form.error ? 'login-error' : undefined} />
    <label htmlFor="password">รหัสผ่าน</label>
    <div className="password-field">
      <input id="password" name="password" type={form.showPassword ? 'text' : 'password'} value={form.password}
        onChange={event => form.changePassword(event.target.value)} autoComplete="current-password"
        placeholder="กรอกรหัสผ่าน" required aria-invalid={!!form.error} aria-describedby={form.error ? 'login-error' : undefined} />
      <button type="button" className="password-toggle" aria-controls="password" aria-pressed={form.showPassword}
        onClick={() => form.setShowPassword(!form.showPassword)}>{form.showPassword ? 'ซ่อน' : 'แสดง'}</button>
    </div>
    {form.error && <p id="login-error" className="login-error" role="alert">{form.error}</p>}
    <button type="submit" className="primary booking-submit" disabled={!form.valid}>{form.busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button>
  </form>
}
