# Barber Booking frontend

React + TypeScript + Vite frontend connected to the Spring Boot + PostgreSQL backend in `C:\Project\Springboot\jongq`.

## Start

Start the backend/database first (see its README), then:

```powershell
npm.cmd install
npm.cmd run dev
```

- `/` and `/user`: customer bookings.
- `/admin`: server-authenticated login and dashboard.
- Home (`/`) and Admin (`/admin`) tabs appear after admin login.

The local dev backend bootstraps admin / admin123. Production credentials are configured on the server. Frontend code contains no admin password and stores no authentication tokens or bookings in browser storage.

## API connection

Vite proxies `/api` to `http://localhost:8080`. Set the `API_TARGET` process environment variable to change the dev backend address. A production host must proxy `/api` to Spring Boot and serve `index.html` for application URLs; Vite's development proxy does not run in a production static build.

Authentication is checked with `/api/auth/me`. Login/logout use HttpOnly session cookies and CSRF tokens from the backend. Refreshing and switching pages retain the server session; backend restarts invalidate sessions. Booking availability and admin lists refresh when the server emits a booking change over a shared SSE connection, after local mutations, on reconnect, on auth changes, or once at Bangkok midnight. There is no periodic polling or unconditional focus reload. Public pages request availability, not customer personal data. API failures show feedback and retry controls; write operations wait for server confirmation.

The initial PostgreSQL database has no bookings. Existing demo data from localStorage is not migrated automatically.

## Structure

```text
src/
  App.tsx                      URL to page mapping
  pages/                       Customer, admin login/dashboard, not-found
  components/
    auth/                      Login form and admin route guard
    common/                    Navigation, dialog, API feedback, icons
    booking/                   Booking form and time picker
    admin/                     Stats, filters, table, row actions
  hooks/                       Page/form state and subscription hooks
  services/
    api.ts                     Fetch, credentials, CSRF, API errors
    authService.ts             Server authentication/session state
    bookingEvents.ts           SSE connection lifecycle
    bookingStore.ts            API booking operations and event invalidation
  constants/booking.ts         Displayed time slots and status labels
  types/                       Shared frontend domain types
```

## Checks

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd test
```

## Live updates

One `/api/booking-events` EventSource connection is shared by booking components on a page. Backend `booking-changed` events contain only a date. Events for the displayed day reload availability and, for signed-in admins, the booking list. A 150ms debounce groups event bursts. Local writes share their refresh with incoming SSE notifications. A change received during an active fetch queues a later reload so stale responses cannot hide a newer change.

SSE reconnects automatically; a reconnect reloads missed changes and checks the existing admin session. While the stream is offline the UI shows a notice and a manual reload button, with a single initial API fallback. Heartbeat comments keep the stream alive and do not fetch booking data.

`/auth/me` runs on initial subscription, on reconnection for an admin, when the known session expiry is reached, and on an explicit retry or cross-tab auth change. Login/logout changes are communicated with BroadcastChannel without sending credentials. Visibility changes check only an already overdue session. It is not checked every minute or on every focus.

After changing the backend to this version, restart it and reload the browser. The SSE request stays Pending in DevTools while its connection is open; this is expected.