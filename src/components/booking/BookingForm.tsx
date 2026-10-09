import { useBookingForm } from '../../hooks/useBookingForm'
import ConfirmDialog from '../common/ConfirmDialog'
import Icon from '../common/Icon'
import TimeSlotPicker from './TimeSlotPicker'

export default function BookingForm() {
  const form = useBookingForm()
  return <>
    <form onSubmit={form.submit}>
      <h3>จองคิวตัดผม</h3>
      <label htmlFor="name">ชื่อลูกค้า</label>
      <input id="name" placeholder="กรอกชื่อของคุณ" value={form.name} onChange={event => form.setName(event.target.value)} autoComplete="name" maxLength={80} required />
      <label htmlFor="phone">เบอร์โทรศัพท์</label>
      <input id="phone" type="tel" inputMode="numeric" placeholder="08XXXXXXXX" value={form.phone}
        onChange={event => form.setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
        autoComplete="tel" pattern="0[689][0-9]{8}" required aria-invalid={form.phoneInvalid}
        aria-describedby={form.phoneInvalid ? 'phone-help' : undefined} />
      {form.phoneInvalid && <p className="field-error" id="phone-help">กรอกเบอร์มือถือ 10 หลัก เริ่มต้นด้วย 06, 08 หรือ 09</p>}
      <TimeSlotPicker loading={form.loading} availabilityReady={form.availabilityReady} selected={form.selected} isOccupied={form.isOccupied} isExpired={form.isExpired} onSelect={form.selectTime} />
      <p className="hint">เวลาสีจางคือคิวที่ถูกจองแล้วหรือผ่านเวลาแล้ว (เวลาไทย)</p>
      <button className="primary booking-submit" disabled={!form.valid}>ตรวจสอบการจอง <Icon kind="arrow" /></button>
    </form>
    {form.notice && <p className="notice" role="status">{form.notice}</p>}
    <ConfirmDialog busy={form.busy} open={form.review} title="ตรวจสอบการจอง" confirmLabel="ยืนยันการจอง" onClose={() => form.setReview(false)} onConfirm={form.confirmBooking}>
      <dl>
        <div><dt>ชื่อลูกค้า</dt><dd>{form.name.trim()}</dd></div>
        <div><dt>เบอร์โทรศัพท์</dt><dd>{form.phone}</dd></div>
        <div><dt>เวลา</dt><dd>{form.selected} น.</dd></div>
      </dl>
    </ConfirmDialog>
  </>
}
