import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import AdminLoginPage from '../../pages/AdminLoginPage'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  // A failed session lookup must not remove the form needed to sign in again.
  return isAuthenticated ? children : <AdminLoginPage />
}
