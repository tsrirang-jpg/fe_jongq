import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from './useAuth'

export function useLoginForm() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const valid = !!username.trim() && !!password && !busy
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    setBusy(true)
    setError('')
    try {
      const result = await login(username, password)
      if (!result.ok) { setError(result.error); setPassword('') }
    } catch {
      setError('ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง')
    } finally {
      setBusy(false)
    }
  }
  return {
    username, password, showPassword, setShowPassword, error, busy, valid, submit,
    changeUsername(value: string) { setUsername(value); setError('') },
    changePassword(value: string) { setPassword(value); setError('') },
  }
}