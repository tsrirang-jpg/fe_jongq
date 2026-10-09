import CustomerBookingPage from './pages/CustomerBookingPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import RequireAdmin from './components/auth/RequireAdmin'
import AdminNavigation from './components/common/AdminNavigation'
import './App.css'

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
  let page
  if (pathname === '/' || pathname === '/user') page = <CustomerBookingPage />
  else if (pathname === '/admin') page = <RequireAdmin><AdminDashboardPage /></RequireAdmin>
  else page = <NotFoundPage />
  return <><AdminNavigation pathname={pathname} />{page}</>
}
