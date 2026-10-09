import { useAdminDashboard } from '../hooks/useAdminDashboard'
import BookingFilters from '../components/admin/BookingFilters'
import BookingTable from '../components/admin/BookingTable'
import DashboardStats from '../components/admin/DashboardStats'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Icon from '../components/common/Icon'
import BookingFeedback from '../components/common/BookingFeedback'

export default function AdminDashboardPage() {
  const dashboard = useAdminDashboard()
  return <main className="page">
    <section aria-labelledby="admin-title">
      <div className="section-heading"><h1 id="admin-title">Admin Dashboard</h1><span className="badge">Admin</span></div>
      <div className="panel dashboard-panel">
        <header className="dashboard-heading"><div><h2>Dashboard</h2><p>ข้อมูลการจองวันนี้</p></div><Icon kind="grid" /></header>
        <DashboardStats stats={dashboard.stats} />
        <BookingFilters value={dashboard.filter} onChange={dashboard.setFilter} />
        <BookingTable disabled={dashboard.busy} bookings={dashboard.visibleBookings} onStatusChange={dashboard.changeBookingStatus} onDelete={dashboard.setDeleting} />
        <p className="dashboard-note">เปลี่ยนสถานะและลบคิวได้จากเมนูจัดการ ข้อมูลบันทึกลงระบบทันที</p>
      </div>
    </section>
    <BookingFeedback />
    <ConfirmDialog busy={dashboard.busy} open={!!dashboard.deleting} title="ยืนยันการลบคิว" confirmLabel="ยืนยันลบคิว" onClose={() => dashboard.setDeleting(null)} onConfirm={dashboard.confirmDelete}>
      <p>ต้องการลบคิวของ {dashboard.deleting?.name} เวลา {dashboard.deleting?.time} ใช่ไหม?</p>
    </ConfirmDialog>
  </main>
}
