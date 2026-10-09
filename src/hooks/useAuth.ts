import { useSyncExternalStore } from 'react'
import { getAuthSnapshot, login, logout, refreshSession, subscribeAuth } from '../services/authService'

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribeAuth, getAuthSnapshot)
  return { ...snapshot, isAuthenticated: snapshot.admin?.role === 'admin', login, logout, refreshSession }
}