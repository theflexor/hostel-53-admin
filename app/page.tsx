"use client"

import { AdminLayout } from "@/components/admin-layout"
import { DashboardOverview } from "@/components/dashboard-overview"
import { useAuth } from "@/components/auth-provider"

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Доступ запрещен. Войдите в систему.</div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Админка хостела
          </h1>
          <p className="text-muted-foreground">
            Управление бронированиями и отчетность
          </p>
        </div>
        <DashboardOverview />
      </div>
    </AdminLayout>
  )
}
