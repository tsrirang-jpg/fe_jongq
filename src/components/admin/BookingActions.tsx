import { STATUS_LABELS } from '../../constants/booking'
import type { Booking, BookingStatus } from '../../types/booking'

type Props = {
  disabled?: boolean
  booking: Booking
  onStatusChange: (id: string, status: BookingStatus) => void
  onDelete: (booking: Booking) => void
}
export default function BookingActions({ booking, disabled, onStatusChange, onDelete }: Props) {
  return <details className="row-menu">
    <summary aria-label={`จัดการคิวของ ${booking.name}`}>•••</summary>
    <div className="menu">
      {(Object.keys(STATUS_LABELS) as BookingStatus[]).map(status => (
        <button key={status} type="button" disabled={disabled || booking.status === status} onClick={event => {
          onStatusChange(booking.id, status)
          event.currentTarget.closest('details')?.removeAttribute('open')
        }}>{STATUS_LABELS[status]}</button>
      ))}
      <button type="button" className="delete-action" disabled={disabled} onClick={event => {
        onDelete(booking)
        event.currentTarget.closest('details')?.removeAttribute('open')
      }}>ลบคิว</button>
    </div>
  </details>
}
