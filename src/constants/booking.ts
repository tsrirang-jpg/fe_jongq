import type { BookingStatus } from '../types/booking'

export const TIME_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00']
export const STATUS_LABELS: Record<BookingStatus, string> = {
  waiting: 'รอคิว', cutting: 'กำลังตัด', done: 'เสร็จแล้ว',
}