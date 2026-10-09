import { api, errorMessage } from './api'
import { getAuthSnapshot, refreshSession, subscribeAuth } from './authService'
import { subscribeBookingEvents } from './bookingEvents'
import type { Booking, BookingInput, BookingStatus } from '../types/booking'

type Availability = { date: string; slots: { time: string; available: boolean }[] }
type Snapshot = { bookings: Booking[]; occupiedTimes: string[]; date: string | null; loading: boolean; error: string | null; liveError: string | null }
let snapshot: Snapshot = { bookings: [], occupiedTimes: [], date: null, loading: true, error: null, liveError: null }
let generation = 0
let writes = 0
let refreshPromise: Promise<void> | null = null
let refreshQueued = false
let refreshTimer: number | undefined
let dayTimer: number | undefined
let unsubscribeAuth: (() => void) | undefined
let unsubscribeEvents: (() => void) | undefined
const listeners = new Set<() => void>()
export const getBookingSnapshot = () => snapshot
export function isValidPhone(phone: string) { return /^0[689]\d{8}$/.test(phone) }
function publish(next: Snapshot) {
  snapshot = next
  listeners.forEach(listener => listener())
}
async function loadBookings() {
  const request = generation
  const authenticated = getAuthSnapshot().admin !== null
  try {
    const availability = await api<Availability>('/slots')
    const bookings = authenticated ? await api<Booking[]>(`/bookings?date=${availability.date}`) : []
    if (request === generation) publish({
      ...snapshot, bookings, date: availability.date,
      occupiedTimes: availability.slots.filter(slot => !slot.available).map(slot => slot.time), loading: false, error: null,
    })
  } catch (error) {
    if (request === generation) publish({ ...snapshot, loading: false, error: errorMessage(error) })
  }
}
export function refreshBookings(): Promise<void> {
  window.clearTimeout(refreshTimer)
  refreshTimer = undefined
  if (refreshPromise) {
    refreshQueued = true
    return refreshPromise
  }
  refreshPromise = (async () => {
    do {
      refreshQueued = false
      await loadBookings()
    } while (refreshQueued && listeners.size > 0)
  })().finally(() => { refreshPromise = null })
  return refreshPromise
}
function scheduleRefresh() {
  if (writes > 0) return // Local writes refresh once after their response, sharing the SSE invalidation.
  window.clearTimeout(refreshTimer)
  // Group a burst of server changes into a single reload.
  refreshTimer = window.setTimeout(() => { void refreshBookings() }, 150)
}
function scheduleDayChange() {
  // Reload once at midnight in Bangkok so an overnight page moves to the new day.
  const dayMs = 86_400_000
  const bangkokNow = Date.now() + 7 * 60 * 60 * 1000
  dayTimer = window.setTimeout(() => {
    void refreshBookings()
    scheduleDayChange()
  }, dayMs - (bangkokNow % dayMs) + 100)
}
export function subscribeBookings(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    let username = getAuthSnapshot().admin?.username
    unsubscribeAuth = subscribeAuth(() => {
      const nextUsername = getAuthSnapshot().admin?.username
      if (nextUsername === username) return
      username = nextUsername
      generation++ // Discard an in-flight admin response after logout.
      publish({ ...snapshot, bookings: [], loading: true })
      scheduleRefresh()
    })
    let fallbackLoaded = false
    unsubscribeEvents = subscribeBookingEvents({
      onConnected(reconnected) {
        publish({ ...snapshot, liveError: null })
        if (reconnected && getAuthSnapshot().admin) {
          void refreshSession().then(scheduleRefresh)
        } else scheduleRefresh()
      },
      onChanged(date) {
        if (snapshot.date === null || date === snapshot.date) scheduleRefresh()
      },
      onUnavailable() {
        publish({ ...snapshot, liveError: 'การอัปเดตสดขาดการเชื่อมต่อ ระบบกำลังเชื่อมต่อใหม่ คุณสามารถกดโหลดข้อมูลใหม่ได้' })
        // Load once if SSE is unavailable initially; do not turn retries into polling.
        if (!fallbackLoaded && snapshot.date === null) {
          fallbackLoaded = true
          void refreshBookings()
        }
      },
    })
    scheduleDayChange()
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      window.clearTimeout(refreshTimer)
      window.clearTimeout(dayTimer)
      unsubscribeEvents?.()
      unsubscribeAuth?.()
      refreshQueued = false
      generation++
    }
  }
}
async function write(operation: () => Promise<unknown>): Promise<boolean> {
  writes++
  let message: string | null = null
  try { await operation() }
  catch (error) { message = errorMessage(error) }
  finally {
    writes--
    if (writes === 0) await refreshBookings()
  }
  if (message) publish({ ...snapshot, error: message })
  return message === null
}
export function createBooking(input: BookingInput): Promise<boolean> {
  return write(async () => {
    if (!snapshot.date) throw new Error('กรุณารอโหลดเวลาว่างก่อนจอง')
    return api<Booking>('/bookings', { method: 'POST', body: { ...input, date: snapshot.date } })
  })
}
export const changeBookingStatus = (id: string, status: BookingStatus) => write(() => api(`/bookings/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }))
export const removeBooking = (id: string) => write(() => api(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }))