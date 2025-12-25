"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"

interface RoomData {
  roomId: string
  roomName: string
  categoryName: string
  revenue: number
  bookings: number
  occupancyRate: number
}

interface RoomPerformanceProps {
  rooms: RoomData[]
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-xl border border-border/50 bg-card/95 p-4 shadow-2xl backdrop-blur-md">
        <p className="mb-1 font-semibold text-foreground">{data.roomName}</p>
        <p className="mb-3 text-xs text-muted-foreground">{data.categoryName}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-sm text-muted-foreground">Доход</span>
            </div>
            <span className="font-semibold text-foreground">{data.revenue.toLocaleString("ru-RU")} сом</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm text-muted-foreground">Брони</span>
            </div>
            <span className="font-semibold text-foreground">{data.bookings}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm text-muted-foreground">Заполняемость</span>
            </div>
            <span className="font-semibold text-foreground">{data.occupancyRate.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

const getBarColor = (occupancy: number) => {
  if (occupancy >= 80) return "#10b981"
  if (occupancy >= 50) return "#3b82f6"
  return "#f59e0b"
}

export function RoomPerformance({ rooms }: RoomPerformanceProps) {
  if (rooms.length === 0) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Производительность комнат</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            Нет данных о производительности комнат
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = rooms.slice(0, 8).map((room) => ({
    ...room,
    shortName: room.roomName.length > 10 ? room.roomName.slice(0, 10) + "..." : room.roomName,
  }))

  const totalRevenue = rooms.reduce((sum, r) => sum + r.revenue, 0)
  const avgOccupancy = rooms.reduce((sum, r) => sum + r.occupancyRate, 0) / rooms.length

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Производительность комнат</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Доход и заполняемость по комнатам</p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-lg font-bold text-foreground">{totalRevenue.toLocaleString("ru-RU")}</p>
              <p className="text-xs text-muted-foreground">Доход (сом)</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{avgOccupancy.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Ср. заполн.</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
            <XAxis
              dataKey="shortName"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={70}
              interval={0}
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
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }} />
            <Legend
              wrapperStyle={{ paddingTop: "10px" }}
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
            <Bar yAxisId="left" dataKey="revenue" name="Доход" radius={[6, 6, 0, 0]} maxBarSize={32}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancyRate)} />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="occupancyRate"
              name="Заполняемость"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">80%+ заполн.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">50-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">&lt;50%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
