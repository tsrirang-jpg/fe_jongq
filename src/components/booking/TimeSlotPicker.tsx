import { TIME_SLOTS } from '../../constants/booking'

type Props = { selected: string; isOccupied: (time: string) => boolean; onSelect: (time: string) => void }
export default function TimeSlotPicker({ selected, isOccupied, onSelect }: Props) {
  return <fieldset>
    <legend>เลือกเวลาที่ต้องการ</legend>
    <div className="time-grid">{TIME_SLOTS.map(time => (
      <button key={time} type="button" className={`time-slot ${selected === time ? 'selected' : ''}`}
        disabled={isOccupied(time)} aria-pressed={selected === time}
        aria-label={`${time}${isOccupied(time) ? ' ถูกจองแล้ว' : ''}`} onClick={() => onSelect(time)}>{time}</button>
    ))}</div>
  </fieldset>
}
