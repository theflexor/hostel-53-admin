"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts"
import { useState } from "react"
import { Monitor, Users } from "lucide-react"

interface SourceData {
  name: string
  value: number
  revenue: number
  percentage: number
  averageValue: number
  cancellationRate: number
  color: string
}

interface SourcesChartProps {
  data: SourceData[]
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="drop-shadow-xl"
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 8}
        outerRadius={innerRadius - 3}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.5}
      />
      <text x={cx} y={cy - 15} textAnchor="middle" className="fill-foreground text-2xl font-bold">
        {payload.value}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="fill-muted-foreground text-sm">
        броней
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" className="fill-muted-foreground text-xs">
        {payload.percentage.toFixed(0)}%
      </text>
    </g>
  )
}

export function SourcesChart({ data }: SourcesChartProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (data.length === 0 || data.every((s) => s.value === 0)) {
    return (
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Источники бронирований</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            Нет данных об источниках
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Источники бронирований</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Распределение по каналам продаж</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-foreground">{totalRevenue.toLocaleString("ru-RU")}</p>
            <p className="text-xs text-muted-foreground">Общий доход (сом)</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} className="transition-all duration-300" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {data.map((entry, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                activeIndex === index ? "bg-muted ring-2 ring-primary/20" : "bg-muted/40 hover:bg-muted/60"
              }`}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${entry.color}20` }}
                >
                  {entry.name === "Ресепшн" ? (
                    <Users className="h-5 w-5" style={{ color: entry.color }} />
                  ) : (
                    <Monitor className="h-5 w-5" style={{ color: entry.color }} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.percentage.toFixed(0)}% от всех</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Доход</p>
                  <p className="font-semibold text-foreground">{entry.revenue.toLocaleString("ru-RU")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ср. чек</p>
                  <p className="font-semibold text-foreground">
                    {Math.round(entry.averageValue).toLocaleString("ru-RU")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Брони</p>
                  <p className="font-semibold text-foreground">{entry.value}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Отмены</p>
                  <p className="font-semibold text-foreground">{entry.cancellationRate}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
