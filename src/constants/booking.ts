import type { BookingStatus } from '../types/booking'

export const TIME_SLOTS = Array.from({ length: 19 }, (_, index) => {
  const minutes = 9 * 60 + index * 30
  return Math.floor(minutes / 60).toString().padStart(2, '0') + ':' + (minutes % 60).toString().padStart(2, '0')
})
export const STATUS_LABELS: Record<BookingStatus, string> = {
  waiting: 'รอคิว', cutting: 'กำลังตัด', done: 'เสร็จแล้ว',
}
