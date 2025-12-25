"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Users, Banknote } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface BusiestDay {
  date: string
  bookings: number
  revenue: number
}

interface BusiestDaysProps {
  days: BusiestDay[]
}

export function BusiestDays({ days }: BusiestDaysProps) {
  if (days.length === 0) return null

  const maxRevenue = Math.max(...days.map((d) => d.revenue))

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Самые загруженные дни</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {days.map((day, index) => (
            <div
              key={day.date}
              className="group relative overflow-hidden rounded-xl bg-muted/30 p-4 transition-all duration-200 hover:bg-muted/50"
            >
              {/* Progress bar background */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent transition-all duration-500"
                style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {format(new Date(day.date), "dd MMMM yyyy", { locale: ru })}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {day.bookings} броней
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold text-foreground">{day.revenue.toLocaleString("ru-RU")} сом</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
