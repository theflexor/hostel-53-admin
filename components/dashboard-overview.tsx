"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Download,
  TrendingUp,
  Users,
  Loader2,
  AlertTriangle,
  DollarSign,
  AlertCircle,
  Calendar,
} from "lucide-react"
import { HostelAPI, type AdminAnalyticsDashboardResponse } from "@/lib/api"
import { format, subDays } from "date-fns"
import { ru } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted))",
  reception: "#8b5cf6", // purple
  website: "#3b82f6", // blue
}

export function DashboardOverview() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Default to last 30 days
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"))
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
    if (!analytics) {
      console.log("No data to export")
      return
    }

    console.log(`Exporting data as ${format}`)
    const data = {
      period: { startDate, endDate },
      summary: analytics.summary,
      revenueTrend: analytics.revenueTrend,
      bookingSources: analytics.bookingSources,
      roomPerformance: analytics.roomPerformance,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hostel-analytics-${startDate}-to-${endDate}.${format === "excel" ? "xlsx" : "csv"}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const setPresetPeriod = (days: number) => {
    setEndDate(format(new Date(), "yyyy-MM-dd"))
    setStartDate(format(subDays(new Date(), days), "yyyy-MM-dd"))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка аналитики...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-2 py-8">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div className="text-red-800">
            <div className="font-semibold">Ошибка загрузки аналитики</div>
            <div className="text-sm">{error}</div>
            <Button variant="outline" className="mt-2" onClick={fetchAnalytics}>
              Повторить
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Нет данных для отображения
        </CardContent>
      </Card>
    )
  }

  const { summary, trends, breakdown, performance, insights } = analytics

  // Prepare pie chart data for booking sources
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
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Период анализа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="startDate">Начало периода</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="endDate">Конец периода</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPresetPeriod(7)}>
                7 дней
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPresetPeriod(30)}>
                30 дней
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPresetPeriod(90)}>
                90 дней
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Общий доход</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summary.revenue.confirmed.toLocaleString("ru-RU")} сом
            </div>
            <p className="text-xs text-muted-foreground">
              Средний чек: {Math.round(summary.revenue.average)} сом
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Бронирования</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.bookings.total}</div>
            <p className="text-xs text-muted-foreground">
              Подтверждено: {summary.bookings.confirmed} | Активно: {summary.bookings.active}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Заполняемость</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{summary.occupancy.rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.occupancy.occupiedBedNights} из {summary.occupancy.totalBedNights} койко-ночей
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Отмены</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.bookings.cancelled}</div>
            <p className="text-xs text-muted-foreground">
              {summary.bookings.cancellationRate.toFixed(1)}% | Потери: {summary.revenue.cancelled.toLocaleString()} сом
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Аналитика и отчеты</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("excel")}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Charts Row 1: Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Динамика доходов и броней</CardTitle>
        </CardHeader>
        <CardContent>
          {trends.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: ru })}
                />
                <YAxis yAxisId="left" label={{ value: "Доход (сом)", angle: -90, position: "insideLeft" }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{ value: "Брони", angle: 90, position: "insideRight" }}
                />
                <Tooltip
                  labelFormatter={(value) => format(new Date(value), "dd MMMM yyyy", { locale: ru })}
                  formatter={(value: number, name: string) => {
                    if (name === "revenue") return [`${value} сом`, "Доход"]
                    if (name === "bookings") return [value, "Брони"]
                    if (name === "guests") return [value, "Гости"]
                    if (name === "averageRate") return [`${value} сом`, "Средний чек"]
                    return [value, name]
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bookings"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">Нет данных о доходах за выбранный период</div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row 2: Sources & Room Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Источники бронирований</CardTitle>
          </CardHeader>
          <CardContent>
            {sourcesData.length > 0 && sourcesData.some((s) => s.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourcesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sourcesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value} броней (${props.payload.percentage.toFixed(1)}%)`,
                        props.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-4">
                  {sourcesData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-sm font-medium">{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {entry.value} ({entry.percentage.toFixed(1)}%)
                        </div>
                        <div className="text-xs text-muted-foreground">{entry.revenue.toLocaleString()} сом</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">Нет данных об источниках</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Производительность комнат</CardTitle>
          </CardHeader>
          <CardContent>
            {performance.rooms.length > 0 ? (
              <div className="space-y-3">
                {performance.rooms.slice(0, 5).map((room) => (
                  <div key={room.roomId} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{room.roomName}</p>
                        <p className="text-xs text-muted-foreground">{room.categoryName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{room.revenue.toLocaleString()} сом</p>
                        <p className="text-xs text-muted-foreground">
                          {room.bookings} броней | {room.occupancyRate.toFixed(0)}% заполн.
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min(room.occupancyRate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Нет данных о производительности комнат
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      {breakdown.byStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Разбивка по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {breakdown.byStatus.map((status) => (
                <div key={status.status} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {status.status === "CONFIRMED" && "Подтверждено"}
                      {status.status === "ACTIVE" && "Активно"}
                      {status.status === "COMPLETED" && "Завершено"}
                      {status.status === "CANCELLED" && "Отменено"}
                    </span>
                    <Badge variant="outline">{status.percentage.toFixed(1)}%</Badge>
                  </div>
                  <div className="text-2xl font-bold">{status.count}</div>
                  <div className="text-sm text-muted-foreground">{status.revenue.toLocaleString()} сом</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      {insights.topRooms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Лучшие комнаты по доходу</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.topRooms.map((room, index) => (
                <div key={room.roomId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="h-8 w-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{room.roomName}</span>
                  </div>
                  <span className="font-semibold">{room.revenue.toLocaleString()} сом</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busiest Days */}
      {insights.busiestDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Самые загруженные дни</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.busiestDays.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{format(new Date(day.date), "dd MMMM yyyy", { locale: ru })}</p>
                    <p className="text-sm text-muted-foreground">{day.bookings} броней</p>
                  </div>
                  <span className="font-semibold">{day.revenue.toLocaleString()} сом</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Детальная статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Финансы</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Подтвержденный доход:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {summary.revenue.confirmed.toLocaleString()} сом
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Упущенный доход:</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {summary.revenue.cancelled.toLocaleString()} сом
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Средний чек:</span>
                  <span className="font-medium">{Math.round(summary.revenue.average)} сом</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Бронирования</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Всего:</span>
                  <span className="font-medium">{summary.bookings.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Отменено:</span>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {summary.bookings.cancelled}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Процент отмен:</span>
                  <span className="font-medium">{summary.bookings.cancellationRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Гости</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Всего гостей:</span>
                  <span className="font-medium">{summary.guests.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">В среднем на бронь:</span>
                  <span className="font-medium">{summary.guests.averagePerBooking.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
