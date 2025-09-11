import { AdminLayout } from "@/components/admin-layout"
import { DashboardOverview } from "@/components/dashboard-overview"

export default function HomePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Админка хостела</h1>
          <p className="text-muted-foreground">Управление бронированиями и отчетность</p>
        </div>
        <DashboardOverview />
      </div>
    </AdminLayout>
  )
}
