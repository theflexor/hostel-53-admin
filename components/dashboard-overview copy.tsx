"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Download,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { HostelAPI, type AdminAnalyticsDashboardResponse } from "@/lib/api"
import { format, subDays } from "date-fns"

import { StatCard } from "./stat-card"
import { SkeletonCard, SkeletonChart } from "./skeleton-card"
import { RevenueChart } from "./revenue-chart"
import { SourcesChart } from "./sources-chart"
import { RoomPerformance } from "./room-performance"
import { StatusBreakdown } from "./status-breakdown"
import { TopRooms } from "./top-rooms"
import { BusiestDays } from "./busiest-days"
import { DetailedStats } from "./detailed-stats"

const COLORS = {
  reception: "#8b5cf6",
  website: "#3b82f6",
}

export function DashboardOverview() {
  const [analytics, setAnalytics] =
    useState<AdminAnalyticsDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  )
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    fetchAnalytics()
  }, [startDate, endDate])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await HostelAPI.getAnalytics({ startDate, endDate })
      setAnalytics(data)
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
      setError("Не удалось загрузить аналитику. Проверьте авторизацию.")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: "excel" | "csv") => {
    if (!analytics) return

    const data = {
      period: { startDate, endDate },
      summary: analytics.summary,
      revenueTrend: analytics.trends.daily,
      bookingSources: analytics.breakdown.bySources,
      roomPerformance: analytics.performance.rooms,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hostel-analytics-${startDate}-to-${endDate}.${
      format === "excel" ? "xlsx" : "csv"
    }`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const setPresetPeriod = (days: number) => {
    setEndDate(format(new Date(), "yyyy-MM-dd"))
    setStartDate(format(subDays(new Date(), days), "yyyy-MM-dd"))
  }

  // Loading state with skeletons
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-card/50 p-4 backdrop-blur-sm">
          <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-16 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        <SkeletonChart className="h-[500px]" />

        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonChart className="h-[480px]" />
          <SkeletonChart className="h-[480px]" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="flex items-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose-500/10">
              <AlertTriangle className="h-7 w-7 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                Ошибка загрузки аналитики
              </h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              onClick={fetchAnalytics}
              className="gap-2 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Повторить
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            Нет данных для отображения
          </CardContent>
        </Card>
      </div>
    )
  }

  const { summary, trends, breakdown, performance, insights } = analytics

  const sourcesData = breakdown.bySources.map((source) => ({
    name: source.source === "RECEPTION" ? "Ресепшн" : "Сайт",
    value: source.bookings,
    revenue: source.revenue,
    percentage: source.percentage,
    averageValue: source.averageValue,
    cancellationRate: source.cancellationRate,
    color: source.source === "RECEPTION" ? COLORS.reception : COLORS.website,
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card/50 px-4 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Период:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-36 bg-background/50"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-36 bg-background/50"
            />
          </div>
          <div className="flex gap-1.5">
            {[
              { label: "7д", days: 7 },
              { label: "30д", days: 30 },
              { label: "90д", days: 90 },
            ].map((preset) => (
              <Button
                key={preset.days}
                variant="ghost"
                size="sm"
                onClick={() => setPresetPeriod(preset.days)}
                className="h-8 px-3 text-xs hover:bg-primary hover:text-primary-foreground"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport("csv")}
            className="h-8 gap-1.5 px-3"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport("excel")}
            className="h-8 gap-1.5 px-3"
          >
            <Download className="h-3.5 w-3.5" />
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Общий доход"
          value={summary.revenue.confirmed}
          suffix="сом"
          subtitle={`Средний чек: ${Math.round(
            summary.revenue.average
          ).toLocaleString("ru-RU")} сом`}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          iconBgClass="bg-emerald-500/10"
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />
        <StatCard
          title="Бронирования"
          value={summary.bookings.total}
          subtitle={`Ожидаемые: ${summary.bookings.confirmed} | Активно: ${summary.bookings.active}`}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBgClass="bg-blue-500/10"
          trend={{ value: 8, isPositive: true }}
          delay={100}
        />
        <StatCard
          title="Заполняемость"
          value={Math.round(summary.occupancy.rate)}
          suffix="%"
          subtitle={`${summary.occupancy.occupiedBedNights} из ${summary.occupancy.totalBedNights} койко-ночей`}
          icon={<Calendar className="h-5 w-5 text-violet-600" />}
          iconBgClass="bg-violet-500/10"
          trend={{ value: 5, isPositive: true }}
          delay={200}
        />
        <StatCard
          title="Отмены"
          value={summary.bookings.cancelled}
          subtitle={`${summary.bookings.cancellationRate.toFixed(
            1
          )}% | Потери: ${summary.revenue.cancelled.toLocaleString(
            "ru-RU"
          )} сом`}
          icon={<AlertCircle className="h-5 w-5 text-orange-600" />}
          iconBgClass="bg-orange-500/10"
          trend={{ value: 3, isPositive: false }}
          delay={300}
        />
      </div>

      <RevenueChart data={trends.daily} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SourcesChart data={sourcesData} />
        <RoomPerformance rooms={performance.rooms} />
      </div>

      {/* Status Breakdown - full width */}
      <StatusBreakdown data={breakdown.byStatus} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopRooms rooms={insights.topRooms} />
        <BusiestDays days={insights.busiestDays} />
      </div>

      {/* Detailed Stats */}
      <DetailedStats summary={summary} />
    </div>
  )
}
