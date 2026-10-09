import { TIME_SLOTS } from '../../constants/booking'

type Props = {
  selected: string
  isOccupied: (time: string) => boolean
  isExpired: (time: string) => boolean
  onSelect: (time: string) => void
}
export default function TimeSlotPicker({ selected, isOccupied, isExpired, onSelect }: Props) {
  return <fieldset>
    <legend>เลือกเวลาที่ต้องการ (09:00–18:00)</legend>
    <div className="time-grid">{TIME_SLOTS.map(time => {
      const expired = isExpired(time)
      const occupied = isOccupied(time)
      const disabled = expired || occupied
      const reason = expired ? 'ผ่านเวลาแล้ว' : occupied ? 'ถูกจองแล้ว' : 'ว่าง'
      return <button key={time} type="button" className={`time-slot ${selected === time && !disabled ? 'selected' : ''}`}
        disabled={disabled} aria-pressed={selected === time && !disabled}
        aria-label={`${time} ${reason}`} title={reason} onClick={() => onSelect(time)}>{time}</button>
    })}</div>
  </fieldset>
}
