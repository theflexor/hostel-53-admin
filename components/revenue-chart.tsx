"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { TrendingUp, TrendingDown } from "lucide-react"

interface RevenueChartProps {
  data: Array<{
    date: string
    revenue: number
    bookings: number
    guests: number
    averageRate: number
  }>
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/95 p-4 shadow-2xl backdrop-blur-md">
        <p className="mb-3 text-sm font-semibold text-foreground">
          {format(new Date(label), "dd MMMM yyyy", { locale: ru })}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-semibold text-foreground">
                {entry.dataKey === "revenue" || entry.dataKey === "averageRate"
                  ? `${entry.value.toLocaleString("ru-RU")} сом`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Динамика доходов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[500px] items-center justify-center text-muted-foreground">
            Нет данных о доходах за выбранный период
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate totals and trends
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalBookings = data.reduce((sum, d) => sum + d.bookings, 0)
  const avgRevenue = totalRevenue / data.length
  const firstHalf = data.slice(0, Math.floor(data.length / 2))
  const secondHalf = data.slice(Math.floor(data.length / 2))
  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length || 0
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length || 0
  const trend = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0
  const isPositive = trend >= 0

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Динамика доходов</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Доходы, бронирования и средний чек за период</p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{totalRevenue.toLocaleString("ru-RU")}</p>
              <p className="text-xs text-muted-foreground">Общий доход (сом)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{totalBookings}</p>
              <p className="text-xs text-muted-foreground">Всего броней</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
                <span className={`text-lg font-bold ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                  {isPositive ? "+" : ""}
                  {trend.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Тренд</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={480}>
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: ru })}
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              width={50}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              name="Доход"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
            />
            <Bar
              yAxisId="right"
              dataKey="bookings"
              name="Брони"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              opacity={0.7}
              maxBarSize={24}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="averageRate"
              name="Средний чек"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
