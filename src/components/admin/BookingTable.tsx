import { STATUS_LABELS } from '../../constants/booking'
import type { Booking, BookingStatus } from '../../types/booking'
import BookingActions from './BookingActions'

type Props = {
  disabled?: boolean
  bookings: Booking[]
  onStatusChange: (id: string, status: BookingStatus) => void
  onDelete: (booking: Booking) => void
}
export default function BookingTable({ bookings, disabled, onStatusChange, onDelete }: Props) {
  return <div className="table-wrap">
    <table>
      <thead><tr><th scope="col">เวลา</th><th scope="col">ลูกค้า</th><th scope="col">สถานะ</th><th scope="col" className="actions-cell">จัดการ</th></tr></thead>
      <tbody>{bookings.map(booking => (
        <tr key={booking.id}>
          <td className="time-cell">{booking.time}</td>
          <td><span className="customer-name">{booking.name}</span><span className="phone">{booking.phone.slice(0, 3)}****{booking.phone.slice(-3)}</span></td>
          <td><span className={`status ${booking.status}`}>{STATUS_LABELS[booking.status]}</span></td>
          <td className="actions-cell"><BookingActions disabled={disabled} booking={booking} onStatusChange={onStatusChange} onDelete={onDelete} /></td>
        </tr>
      ))}</tbody>
    </table>
    {!bookings.length && <p className="empty">ไม่มีรายการจองในสถานะนี้</p>}
  </div>
}
