import { api, errorMessage } from './api'
import { getAuthSnapshot, refreshSession, subscribeAuth } from './authService'
import { subscribeBookingEvents } from './bookingEvents'
import { TIME_SLOTS } from '../constants/booking'
import { getSlotStart, hasSlotExpired } from './bookingTime'
import type { Booking, BookingInput, BookingStatus } from '../types/booking'

type Availability = { date: string; serverNow?: string; slots: { time: string; available: boolean; booked?: boolean; startsAt?: string }[] }
type Snapshot = { bookings: Booking[]; occupiedTimes: string[]; expiredTimes: string[]; slotStartsAt: Record<string, number>; clockOffsetMs: number; date: string | null; loading: boolean; error: string | null; liveError: string | null }
let snapshot: Snapshot = { bookings: [], occupiedTimes: [], expiredTimes: [], slotStartsAt: {}, clockOffsetMs: 0, date: null, loading: true, error: null, liveError: null }
let generation = 0
let writes = 0
let refreshPromise: Promise<void> | null = null
let refreshQueued = false
let refreshTimer: number | undefined
let dayTimer: number | undefined
let expiryTimer: number | undefined
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
    const receivedAt = Date.now()
    const serverTime = availability.serverNow ? Date.parse(availability.serverNow) : receivedAt
    const clockOffsetMs = Number.isFinite(serverTime) ? serverTime - receivedAt : 0
    const slotStartsAt = Object.fromEntries(TIME_SLOTS.map(time => [time, getSlotStart(availability.date, time)]))
    for (const slot of availability.slots) {
      if (slot.startsAt) slotStartsAt[slot.time] = Date.parse(slot.startsAt)
    }
    const bookings = authenticated ? await api<Booking[]>(`/bookings?date=${availability.date}`) : []
    if (request === generation) publish({
      ...snapshot, bookings, date: availability.date,
      occupiedTimes: availability.slots.filter(slot => slot.booked ?? !slot.available).map(slot => slot.time),
      expiredTimes: TIME_SLOTS.filter(time => hasSlotExpired(slotStartsAt[time], Date.now() + clockOffsetMs)),
      slotStartsAt, clockOffsetMs, loading: false, error: null,
    })
    if (request === generation && listeners.size > 0) { scheduleSlotExpiry(); scheduleDayChange() }
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
export function isSlotExpired(time: string): boolean {
  return hasSlotExpired(snapshot.slotStartsAt[time], Date.now() + snapshot.clockOffsetMs)
}
function expireSlots() {
  if (!snapshot.date) return
  const expiredTimes = TIME_SLOTS.filter(isSlotExpired)
  if (expiredTimes.join(',') !== snapshot.expiredTimes.join(',')) publish({ ...snapshot, expiredTimes })
  scheduleSlotExpiry()
}
function scheduleSlotExpiry() {
  window.clearTimeout(expiryTimer)
  if (!listeners.size || !snapshot.date) return
  const now = Date.now() + snapshot.clockOffsetMs
  const next = Math.min(...Object.values(snapshot.slotStartsAt).filter(startsAt => startsAt > now))
  if (Number.isFinite(next)) expiryTimer = window.setTimeout(expireSlots, Math.max(1, next - now))
}
function scheduleDayChange() {
  window.clearTimeout(dayTimer)
  // Reload once at midnight in Bangkok so an overnight page moves to the new day.
  const dayMs = 86_400_000
  const bangkokNow = Date.now() + snapshot.clockOffsetMs + 7 * 60 * 60 * 1000
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
    window.addEventListener('focus', expireSlots) // Update disabled buttons only; never fetch on focus.
  }
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      window.clearTimeout(refreshTimer)
      window.clearTimeout(dayTimer)
      window.clearTimeout(expiryTimer)
      window.removeEventListener('focus', expireSlots)
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
    if (isSlotExpired(input.time)) throw new Error('เวลานี้ผ่านไปแล้ว กรุณาเลือกเวลาที่ยังไม่ถึง')
    return api<Booking>('/bookings', { method: 'POST', body: { ...input, date: snapshot.date } })
  })
}
export const changeBookingStatus = (id: string, status: BookingStatus) => write(() => api(`/bookings/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }))
export const removeBooking = (id: string) => write(() => api(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }))