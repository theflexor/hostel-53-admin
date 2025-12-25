"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedNumber } from "./animated-number"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number
  suffix?: string
  subtitle?: string
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  iconBgClass?: string
  delay?: number
}

export function StatCard({
  title,
  value,
  suffix = "",
  subtitle,
  icon,
  trend,
  iconBgClass = "bg-primary/10",
  delay = 0,
}: StatCardProps) {
  return (
    <Card
      className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
            iconBgClass,
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold tracking-tight text-foreground">
            <AnimatedNumber value={value} />
            {suffix && <span className="ml-1 text-lg font-normal text-muted-foreground">{suffix}</span>}
          </div>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trend.isPositive ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}%
            </div>
          )}
        </div>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
