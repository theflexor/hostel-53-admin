"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, CircleCheck, XCircle } from "lucide-react"
import { AnimatedNumber } from "./animated-number"

interface StatusData {
  status: "BOOKED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  count: number
  revenue: number
  percentage: number
}

interface StatusBreakdownProps {
  data: StatusData[]
}

const statusConfig = {
  BOOKED: {
    label: "Забронировано",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  ACTIVE: {
    label: "Активно",
    icon: Clock,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  COMPLETED: {
    label: "Завершено",
    icon: CircleCheck,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
  CANCELLED: {
    label: "Отменено",
    icon: XCircle,
    color: "text-rose-600",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
  },
}

export function StatusBreakdown({ data }: StatusBreakdownProps) {
  if (data.length === 0) return null

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Разбивка по статусам
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {data.map((item) => {
            const config = statusConfig[item.status]
            const Icon = config.icon

            return (
              <div
                key={item.status}
                className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${config.borderColor} ${config.bgColor}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <span className="font-medium text-foreground">
                      {config.label}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-0 bg-background/50"
                  >
                    {item.percentage.toFixed(0)}%
                  </Badge>
                </div>

                <div className="text-3xl font-bold text-foreground">
                  <AnimatedNumber value={item.count} />
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  {item.revenue.toLocaleString("ru-RU")} сом
                </div>

                {/* Decorative element */}
                <div
                  className={`absolute -bottom-4 -right-4 h-16 w-16 rounded-full opacity-20 transition-transform duration-300 group-hover:scale-150 ${config.bgColor}`}
                />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
