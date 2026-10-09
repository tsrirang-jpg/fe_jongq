import { useBookings } from '../../hooks/useBookings'

export default function BookingFeedback() {
  const { loading, error: bookingError, adminError, liveError, refreshBookings } = useBookings()
  const error = bookingError ?? adminError
  if (loading) return <p role="status" className="hint">กำลังโหลดข้อมูลการจอง…</p>
  if (!error && !liveError) return null
  return <div className="api-notice">
    {error ? <p role="alert" className="login-error">{error}</p> : <p role="status" className="hint">{liveError}</p>}
    <button type="button" className="secondary" onClick={() => void refreshBookings()}>โหลดข้อมูลใหม่</button>
  </div>
}