import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

function harness() {
  const requests = []
  const timers = new Map()
  const browserEvents = new Map()
  const documentEvents = new Map()
  const streams = []
  const channels = []
  let timerId = 0
  const server = { signedIn: false, date: '2026-10-08', bookings: [] }
  class FakeEventSource {
    handlers = new Map()
    closed = false
    constructor(url) { assert.equal(url, '/api/booking-events'); streams.push(this) }
    addEventListener(name, callback) { this.handlers.set(name, callback) }
    open() { this.onopen?.() }
    change(date = server.date) { this.handlers.get('booking-changed')?.({ data: JSON.stringify({ date }) }) }
    close() { this.closed = true }
  }
  class FakeBroadcastChannel {
    closed = false
    constructor() { channels.push(this) }
    postMessage() {}
    close() { this.closed = true }
  }
  const browserWindow = {
    setTimeout(callback, delay) { timers.set(++timerId, { callback, delay }); return timerId },
    clearTimeout(id) { timers.delete(id) },
    setInterval() { throw new Error('Periodic polling must not be reintroduced') },
    addEventListener(name, callback) { const set = browserEvents.get(name) ?? new Set(); set.add(callback); browserEvents.set(name, set) },
    removeEventListener(name, callback) { browserEvents.get(name)?.delete(callback) },
    dispatchEvent(event) { browserEvents.get(event.type)?.forEach(callback => callback(event)) },
  }
  const document = {
    visibilityState: 'visible',
    addEventListener(name, callback) { documentEvents.set(name, callback) },
    removeEventListener(name) { documentEvents.delete(name) },
  }
  function response(data, status = 200) { return new Response(status === 204 ? null : JSON.stringify(data), { status }) }
  async function fetch(url, options = {}) {
    const method = options.method ?? 'GET'
    requests.push(`${method} ${url}`)
    const body = options.body ? JSON.parse(options.body) : null
    if (url === '/api/auth/csrf') return response({ token: 'csrf', headerName: 'X-CSRF-TOKEN' })
    if (url === '/api/auth/me') return server.signedIn
      ? response({ username: 'admin', role: 'admin', expiresAt: Date.now() + 28_800_000 })
      : response({ message: 'Signed out' }, 401)
    if (url === '/api/auth/login') {
      if (body.password === 'wrong-password') return response({ message: 'Invalid credentials' }, 401)
      server.signedIn = true
      return response({ username: 'admin', role: 'admin', expiresAt: Date.now() + 28_800_000 })
    }
    if (url === '/api/auth/logout') { server.signedIn = false; return response(null, 204) }
    if (url === '/api/slots') return response({ date: server.date, slots: ['10:00', '10:30', '11:00'].map(time => ({ time, available: !server.bookings.some(booking => booking.time === time) })) })
    if (url.startsWith('/api/bookings?')) return server.signedIn ? response(server.bookings) : response({ message: 'Signed out' }, 401)
    if (method === 'POST' && url === '/api/bookings') {
      const booking = { ...body, id: 'new-booking', status: 'waiting' }
      server.bookings.push(booking)
      streams[0].change()
      return response(booking, 201)
    }
    if (method === 'PATCH') {
      server.bookings[0].status = body.status
      streams[0].change()
      return response(server.bookings[0])
    }
    if (method === 'DELETE') { server.bookings = []; streams[0].change(); return response(null, 204) }
    throw new Error(`Unhandled request: ${method} ${url}`)
  }
  const modules = new Map()
  const context = vm.createContext({ window: browserWindow, document, EventSource: FakeEventSource, BroadcastChannel: FakeBroadcastChannel, fetch, Event, AbortSignal, console })
  function load(file) {
    file = path.resolve(file)
    if (modules.has(file)) return modules.get(file)
    const module = { exports: {} }
    const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } }).outputText
    const execute = vm.runInContext(`(function(module, exports, require) { ${code}\n})`, context, { filename: file })
    execute(module, module.exports, name => load(path.resolve(path.dirname(file), `${name}.ts`)))
    modules.set(file, module.exports)
    return module.exports
  }
  async function flush() {
    for (let step = 0; step < 8; step++) {
      await new Promise(resolve => setTimeout(resolve, 0))
      for (const [id, timer] of [...timers]) {
        if (timer.delay <= 500) { timers.delete(id); timer.callback() }
      }
    }
  }
  return { requests, timers, streams, channels, server, browserWindow, documentEvents, load, flush }
}

test('booking data reloads on changes, not polling or focus, and coalesces local writes', async () => {
  const h = harness()
  const auth = h.load('src/services/authService.ts')
  const bookings = h.load('src/services/bookingStore.ts')
  const stopAuth = auth.subscribeAuth(() => {})
  const stopBookings = bookings.subscribeBookings(() => {})
  const stopSecondBookingConsumer = bookings.subscribeBookings(() => {})
  assert.equal(h.streams.length, 1, 'components share a single stream')
  h.streams[0].open()
  await h.flush()
  assert.equal(h.requests.filter(request => request === 'GET /api/auth/me').length, 1)
  assert.equal(h.requests.filter(request => request === 'GET /api/slots').length, 1)
  const idleRequests = h.requests.length
  h.browserWindow.dispatchEvent(new Event('focus'))
  h.documentEvents.get('visibilitychange')?.()
  await h.flush()
  assert.equal(h.requests.length, idleRequests, 'idle focus does not make API requests')
  assert.ok([...h.timers.values()].every(timer => timer.delay > 60_000), 'only expiry/day-change timers remain')

  h.server.bookings.push({ id: 'external', name: 'Other customer', phone: '0812345678', date: h.server.date, time: '10:00', status: 'waiting' })
  h.streams[0].change(); h.streams[0].change(); h.streams[0].change()
  await h.flush()
  assert.equal(h.requests.filter(request => request === 'GET /api/slots').length, 2, 'burst grouped into one reload')
  assert.equal(bookings.getBookingSnapshot().occupiedTimes.includes('10:00'), true)
  assert.equal(bookings.getBookingSnapshot().bookings.length, 0, 'public state contains no customer list')
  const afterChange = h.requests.length
  h.streams[0].change('2026-10-09')
  h.streams[0].handlers.get('booking-changed')({ data: 'bad-json' })
  await h.flush()
  assert.equal(h.requests.length, afterChange, 'other dates and invalid messages do not reload')

  await auth.login('admin', 'password')
  await h.flush()
  assert.equal(bookings.getBookingSnapshot().bookings.length, 1)
  const beforeWrite = h.requests.filter(request => request === 'GET /api/slots').length
  assert.equal(await bookings.changeBookingStatus('external', 'done'), true)
  await h.flush()
  assert.equal(h.requests.filter(request => request === 'GET /api/slots').length, beforeWrite + 1, 'own response and SSE share one reload')
  assert.equal(bookings.getBookingSnapshot().bookings[0].status, 'done')

  const beforeReconnect = h.requests.filter(request => request === 'GET /api/auth/me').length
  h.streams[0].onerror()
  assert.ok(bookings.getBookingSnapshot().liveError)
  h.streams[0].open()
  await h.flush()
  assert.equal(bookings.getBookingSnapshot().liveError, null)
  assert.equal(h.requests.filter(request => request === 'GET /api/auth/me').length, beforeReconnect + 1)
  h.server.signedIn = false
  h.channels[0].onmessage({ data: 'auth-changed' })
  await h.flush()
  assert.equal(auth.getAuthSnapshot().admin, null)
  assert.equal(bookings.getBookingSnapshot().bookings.length, 0, 'cross-tab logout clears private data')
  stopSecondBookingConsumer(); stopBookings(); stopAuth()
  assert.equal(h.streams[0].closed, true)
  assert.equal(h.channels[0].closed, true)
  assert.equal(h.timers.size, 0, 'unmount cleans up timers')
})

test('SSE outage falls back to one initial load without periodic retry requests', async () => {
  const h = harness()
  const bookings = h.load('src/services/bookingStore.ts')
  const stop = bookings.subscribeBookings(() => {})
  h.streams[0].onerror()
  await h.flush()
  assert.equal(h.requests.filter(request => request === 'GET /api/slots').length, 1)
  h.streams[0].onerror(); h.streams[0].onerror()
  await h.flush()
  assert.equal(h.requests.filter(request => request === 'GET /api/slots').length, 1)
  assert.ok(bookings.getBookingSnapshot().liveError)
  stop()
})

// Protect the message mapping used by the visible login alert.
test('invalid backend credentials produce the requested password warning without signing in', async () => {
  const h = harness()
  const auth = h.load('src/services/authService.ts')
  const result = await auth.login('admin', 'wrong-password')
  assert.equal(result.ok, false)
  assert.equal(result.error, 'รหัสผ่านไม่ถูกต้อง')
  assert.equal(auth.getAuthSnapshot().admin, null)
  assert.equal(h.requests.filter(request => request === 'POST /api/auth/login').length, 1)
})