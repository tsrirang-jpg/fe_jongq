export function getSlotStart(date: string, time: string): number {
  // Interpret a booking in Bangkok independently of the user's device timezone.
  return Date.parse(`${date}T${time}:00+07:00`)
}
export function hasSlotExpired(startsAt: number, serverNow: number): boolean {
  return !Number.isFinite(startsAt) || startsAt <= serverNow
}