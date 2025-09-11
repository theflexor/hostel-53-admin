import { AdminLayout } from "@/components/admin-layout"
import { OccupancyCalendar } from "@/components/occupancy-calendar"

export default function CalendarPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Календарь занятости</h1>
          <p className="text-muted-foreground">Визуальное отображение занятости комнат и коек</p>
        </div>
        <OccupancyCalendar />
      </div>
    </AdminLayout>
  )
}
