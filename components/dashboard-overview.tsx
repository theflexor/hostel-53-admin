"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Download, TrendingUp, Calendar, CheckCircle, Users, Loader2, AlertTriangle } from "lucide-react"
import { apiService } from "@/lib/api"
import type { Booking } from "@/lib/api"

type PeriodFilter = "day" | "week" | "month"

const totalBeds = 8

const mockBookings: Booking[] = [
  {
    id: 1,
    roomId: 1,
    startTime: "2024-01-15T14:00:00Z",
    endTime: "2024-01-18T11:00:00Z",
    firstName: "Иван",
    lastName: "Иванов",
    email: "ivan@example.com",
    phone: "+7 (999) 123-45-67",
    guests: 1,
    bunks: [{ id: 1, number: 1, tier: "BOTTOM", roomId: 1 }],
    guest_name: "Иван Иванов",
    guest_phone: "+7 (999) 123-45-67",
    check_in_date: "2024-01-15",
    check_out_date: "2024-01-18",
    bunk_id: 1,
    status: "confirmed",
  },
  {
    id: 2,
    roomId: 1,
    startTime: "2024-01-16T14:00:00Z",
    endTime: "2024-01-20T11:00:00Z",
    firstName: "Анна",
    lastName: "Петрова",
    email: "anna@example.com",
    phone: "+7 (999) 234-56-78",
    guests: 1,
    bunks: [{ id: 2, number: 2, tier: "TOP", roomId: 1 }],
    guest_name: "Анна Петрова",
    guest_phone: "+7 (999) 234-56-78",
    check_in_date: "2024-01-16",
    check_out_date: "2024-01-20",
    bunk_id: 2,
    status: "confirmed",
  },
  {
    id: 3,
    roomId: 2,
    startTime: "2024-01-10T14:00:00Z",
    endTime: "2024-01-14T11:00:00Z",
    firstName: "Петр",
    lastName: "Сидоров",
    email: "petr@example.com",
    phone: "+7 (999) 345-67-89",
    guests: 1,
    bunks: [{ id: 3, number: 1, tier: "BOTTOM", roomId: 2 }],
    guest_name: "Петр Сидоров",
    guest_phone: "+7 (999) 345-67-89",
    check_in_date: "2024-01-10",
    check_out_date: "2024-01-14",
    bunk_id: 3,
    status: "checked_out",
  },
]

export function DashboardOverview() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        setError(null)
        const bookingsData = await apiService.getAllBookings()
        setBookings(bookingsData)
      } catch (err) {
        console.error("Failed to fetch bookings from API:", err)
        setError("Не удалось загрузить данные о бронированиях")
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  const currentStats = useMemo(() => {
    if (bookings.length === 0) {
      return {
        totalBookings: 0,
        activeBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        occupancyRate: 0,
        todayCheckIns: 0,
      }
    }

    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const currentMonthBookings = bookings.filter((booking) => {
      const checkInDate = new Date(booking.check_in_date)
      return checkInDate.getMonth() === currentMonth && checkInDate.getFullYear() === currentYear
    })

    const activeBookings = bookings.filter((booking) => {
      const checkIn = new Date(booking.check_in_date)
      const checkOut = new Date(booking.check_out_date)
      return checkIn <= now && checkOut > now && booking.status !== "cancelled"
    }).length

    const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled").length
    const completedBookings = bookings.filter((booking) => {
      const checkOut = new Date(booking.check_out_date)
      return checkOut <= now && booking.status !== "cancelled"
    }).length

    const todayCheckIns = bookings.filter((booking) => booking.check_in_date === today).length

    return {
      totalBookings: currentMonthBookings.length,
      activeBookings,
      cancelledBookings,
      completedBookings,
      occupancyRate: Math.round((activeBookings / totalBeds) * 100),
      todayCheckIns,
    }
  }, [bookings])

  const monthlyData = useMemo(() => {
    if (bookings.length === 0) return []

    const months = ["Октябрь", "Ноябрь", "Декабрь", "Январь"]
    const now = new Date()

    return months.map((month, index) => {
      const monthIndex = index === 3 ? 0 : 9 + index // Oct=9, Nov=10, Dec=11, Jan=0
      const year = index === 3 ? now.getFullYear() : now.getFullYear() - 1

      const monthBookings = bookings.filter((booking) => {
        const checkInDate = new Date(booking.check_in_date)
        return checkInDate.getMonth() === monthIndex && checkInDate.getFullYear() === year
      })

      const cancelled = monthBookings.filter((b) => b.status === "cancelled").length
      const completed = monthBookings.filter((b) => {
        const checkOut = new Date(b.check_out_date)
        return checkOut <= now && b.status !== "cancelled"
      }).length
      const active = monthBookings.filter((b) => {
        const checkIn = new Date(b.check_in_date)
        const checkOut = new Date(b.check_out_date)
        return checkIn <= now && checkOut > now && b.status !== "cancelled"
      }).length

      return {
        month,
        bookings: monthBookings.length,
        cancelled,
        completed,
        active,
      }
    })
  }, [bookings])

  const occupancyData = [
    { name: "Занято", value: currentStats.activeBookings, color: "hsl(var(--primary))" },
    { name: "Свободно", value: totalBeds - currentStats.activeBookings, color: "hsl(var(--muted))" },
  ]

  const handleExport = (format: "excel" | "csv") => {
    if (bookings.length === 0) {
      console.log("No data to export")
      return
    }

    console.log(`Exporting data as ${format}`)
    const data = {
      period: periodFilter,
      stats: currentStats,
      monthlyData,
      bookings: bookings.map((booking) => ({
        id: booking.id,
        guestName: booking.guest_name,
        phone: booking.guest_phone,
        checkIn: booking.check_in_date,
        checkOut: booking.check_out_date,
        status: booking.status,
        bunkId: booking.bunk_id,
      })),
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `hostel-report-${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "csv"}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка данных...</span>
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
            <div className="font-semibold">Ошибка загрузки данных</div>
            <div className="text-sm">{error}</div>
            <div className="text-xs mt-1">Проверьте подключение к API серверу</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего броней</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currentStats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">За текущий месяц</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Активные брони</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currentStats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">Сейчас в хостеле</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Заезды сегодня</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currentStats.todayCheckIns}</div>
            <p className="text-xs text-muted-foreground">Ожидаются</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Загруженность</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currentStats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {currentStats.activeBookings} из {totalBeds} коек
            </p>
          </CardContent>
        </Card>
      </div>

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
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Период:</label>
              <Select value={periodFilter} onValueChange={(value: PeriodFilter) => setPeriodFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">День</SelectItem>
                  <SelectItem value="week">Неделя</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Бронирования по месяцам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Текущая загруженность коек</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {occupancyData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Тренд отмен по месяцам</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cancelled" stroke="hsl(var(--destructive))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Детальная статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Статусы бронирований</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Активные:</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {currentStats.activeBookings}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Завершенные:</span>
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                    {currentStats.completedBookings}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Отмененные:</span>
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    {currentStats.cancelledBookings}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Загруженность</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Занято коек:</span>
                  <span className="font-medium">
                    {currentStats.activeBookings} из {totalBeds}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Процент загрузки:</span>
                  <span className="font-medium">{currentStats.occupancyRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Свободно коек:</span>
                  <span className="font-medium">{totalBeds - currentStats.activeBookings}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Общая статистика</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Всего броней:</span>
                  <span className="font-medium">{bookings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Успешных:</span>
                  <span className="font-medium">{currentStats.activeBookings + currentStats.completedBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Процент отмен:</span>
                  <span className="font-medium">
                    {bookings.length > 0 ? Math.round((currentStats.cancelledBookings / bookings.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
