export type BookingStatus = 'waiting' | 'cutting' | 'done'
export type BookingFilter = 'all' | BookingStatus
export interface Booking {
  id: string
  name: string
  phone: string
  date: string
  time: string
  status: BookingStatus
}
export type BookingInput = Pick<Booking, 'name' | 'phone' | 'time'>
