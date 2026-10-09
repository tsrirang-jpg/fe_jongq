import { useState } from 'react'
import type { FormEvent } from 'react'
import { useBookings } from './useBookings'
import { isValidPhone } from '../services/bookingStore'

export function useBookingForm() {
  const { createBooking, isOccupied, isExpired, loading, error, date } = useBookings()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selected, setSelected] = useState('')
  const [review, setReview] = useState(false)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const phoneInvalid = !!phone && !isValidPhone(phone)
  const valid = !!name.trim() && isValidPhone(phone) && !!selected && !isOccupied(selected) && !isExpired(selected) && !!date && !loading && !error && !busy
  function submit(event: FormEvent) {
    event.preventDefault()
    if (valid) setReview(true)
  }
  async function confirmBooking() {
    if (busy) return
    if (isExpired(selected)) { setReview(false); setNotice('เวลานี้ผ่านไปแล้ว กรุณาเลือกเวลาที่ยังไม่ถึง'); return }
    setBusy(true)
    const created = await createBooking({ name, phone, time: selected })
    setBusy(false)
    setReview(false)
    if (!created) { setNotice('ไม่สามารถจองได้ กรุณาตรวจสอบข้อมูลและเลือกเวลาที่ยังว่าง'); return }
    setNotice(`จองคิวเวลา ${selected} สำเร็จแล้ว คุณ${name.trim()}`)
    setName(''); setPhone(''); setSelected('')
  }
  return {
    name, setName, phone, setPhone, selected, review, setReview, notice, busy,
    phoneInvalid, valid, isOccupied, isExpired, submit, confirmBooking,
    selectTime(time: string) { if (isOccupied(time) || isExpired(time)) return; setSelected(time); setNotice('') },
  }
}