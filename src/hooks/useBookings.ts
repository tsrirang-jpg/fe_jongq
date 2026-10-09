import { useSyncExternalStore } from 'react'
import { changeBookingStatus, createBooking, getBookingSnapshot, isSlotExpired, refreshBookings, removeBooking, subscribeBookings } from '../services/bookingStore'

export function useBookings() {
  const snapshot = useSyncExternalStore(subscribeBookings, getBookingSnapshot)
  return {
    ...snapshot, createBooking, changeBookingStatus, removeBooking, refreshBookings,
    isExpired: isSlotExpired,
    isOccupied: (time: string) => snapshot.occupiedTimes.includes(time),
  }
}