type Callbacks = {
  onConnected: (reconnected: boolean) => void
  onChanged: (date: string) => void
  onUnavailable: () => void
}

// A single persistent connection, shared by all booking components in one page.
export function subscribeBookingEvents(callbacks: Callbacks): () => void {
  if (typeof EventSource === 'undefined') {
    callbacks.onUnavailable()
    return () => {}
  }
  const stream = new EventSource('/api/booking-events', { withCredentials: true })
  let opened = false
  stream.onopen = () => {
    callbacks.onConnected(opened)
    opened = true
  }
  stream.addEventListener('booking-changed', event => {
    try {
      const value: unknown = JSON.parse((event as MessageEvent<string>).data)
      if (value && typeof value === 'object' && 'date' in value && typeof value.date === 'string') {
        callbacks.onChanged(value.date)
      }
    } catch { /* Heartbeats and invalid messages do not reload data. */ }
  })
  stream.onerror = () => callbacks.onUnavailable()
  // EventSource retries a broken connection; onopen reloads anything missed offline.
  return () => stream.close()
}