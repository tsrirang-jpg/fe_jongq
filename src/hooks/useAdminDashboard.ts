import { useState } from 'react'
import { useBookings } from './useBookings'
import type { Booking, BookingFilter, BookingStatus } from '../types/booking'

export function useAdminDashboard() {
  const { bookings, changeBookingStatus, removeBooking, loading } = useBookings()
  const [filter, setFilter] = useState<BookingFilter>('all')
  const [deleting, setDeleting] = useState<Booking | null>(null)
  const [busy, setBusy] = useState(false)
  const visibleBookings = bookings.filter(booking => filter === 'all' || booking.status === filter).sort((a, b) => a.time.localeCompare(b.time))
  const stats = [
    { title: 'คิวทั้งหมด', count: bookings.length },
    { title: 'รอคิว', count: bookings.filter(booking => booking.status === 'waiting').length },
    { title: 'เสร็จแล้ว', count: bookings.filter(booking => booking.status === 'done').length },
  ]
  async function updateStatus(id: string, status: BookingStatus) {
    if (busy) return
    setBusy(true)
    await changeBookingStatus(id, status)
    setBusy(false)
  }
  async function confirmDelete() {
    if (!deleting || busy) return
    setBusy(true)
    const removed = await removeBooking(deleting.id)
    setBusy(false)
    if (removed) setDeleting(null)
  }
  return { filter, setFilter, deleting, setDeleting, visibleBookings, stats, busy: busy || loading, changeBookingStatus: updateStatus, confirmDelete }
}