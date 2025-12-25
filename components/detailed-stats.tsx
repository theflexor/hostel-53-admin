"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Banknote, CalendarCheck, Percent } from "lucide-react"

interface DetailedStatsProps {
  summary: {
    revenue: {
      confirmed: number
      cancelled: number
      average: number
    }
    bookings: {
      total: number
      confirmed: number
      active: number
      cancelled: number
      cancellationRate: number
    }
    occupancy: {
      rate: number
      occupiedBedNights: number
      totalBedNights: number
    }
  }
}

export function DetailedStats({ summary }: DetailedStatsProps) {
  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Детальная статистика
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Finance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Banknote className="h-4 w-4 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-foreground">Финансы</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Подтвержденный доход
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                  {summary.revenue.confirmed.toLocaleString("ru-RU")} сом
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Упущенный доход
                </span>
                <Badge
                  variant="destructive"
                  className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
                >
                  {summary.revenue.cancelled.toLocaleString("ru-RU")} сом
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Средний чек
                </span>
                <span className="font-medium text-foreground">
                  {Math.round(summary.revenue.average).toLocaleString("ru-RU")}{" "}
                  сом
                </span>
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <CalendarCheck className="h-4 w-4 text-blue-600" />
              </div>
              <h4 className="font-semibold text-foreground">Бронирования</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Всего бронирований
                </span>
                <span className="font-medium text-foreground">
                  {summary.bookings.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ожидаемый</span>
                <span className="font-medium text-foreground">
                  {summary.bookings.confirmed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Активно</span>
                <span className="font-medium text-foreground">
                  {summary.bookings.active}
                </span>
              </div>
            </div>
          </div>

          {/* Occupancy */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Percent className="h-4 w-4 text-violet-600" />
              </div>
              <h4 className="font-semibold text-foreground">Заполняемость</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Общая заполняемость
                </span>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  {summary.occupancy.rate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Занято койко-ночей
                </span>
                <span className="font-medium text-foreground">
                  {summary.occupancy.occupiedBedNights}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Всего койко-ночей
                </span>
                <span className="font-medium text-foreground">
                  {summary.occupancy.totalBedNights}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
