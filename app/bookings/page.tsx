import { AdminLayout } from "@/components/admin-layout"
import { BookingsTable } from "@/components/bookings-table"

export default function BookingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Бронирования</h1>
          <p className="text-muted-foreground">Управление всеми бронированиями хостела</p>
        </div>
        <BookingsTable />
      </div>
    </AdminLayout>
  )
}
