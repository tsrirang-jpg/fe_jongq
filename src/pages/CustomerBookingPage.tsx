import BookingForm from '../components/booking/BookingForm'
import Icon from '../components/common/Icon'
import BookingFeedback from '../components/common/BookingFeedback'

export default function CustomerBookingPage() {
  return <main className="page">
    <section aria-labelledby="customer-title">
      <div className="section-heading"><h1 id="customer-title">Customer Booking</h1><span className="badge green">Booking</span></div>
      <div className="panel booking-panel">
        <header className="brand"><Icon kind="scissors" /><div><h2>BARBER BOOKING</h2><p>จองคิวตัดผมออนไลน์</p></div></header>
        <BookingForm />
      </div>
    </section>
    <BookingFeedback />
  </main>
}
