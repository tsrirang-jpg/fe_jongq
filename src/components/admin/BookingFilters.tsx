import { STATUS_LABELS } from '../../constants/booking'
import type { BookingFilter } from '../../types/booking'

type Props = { value: BookingFilter; onChange: (filter: BookingFilter) => void }
export default function BookingFilters({ value, onChange }: Props) {
  return <div className="filters" role="group" aria-label="กรองสถานะคิว">
    {(['all', 'waiting', 'done'] as const).map(filter => (
      <button type="button" key={filter} className={value === filter ? 'active' : ''}
        aria-pressed={value === filter} onClick={() => onChange(filter)}>
        {filter === 'all' ? 'ทั้งหมด' : STATUS_LABELS[filter]}
      </button>
    ))}
  </div>
}
