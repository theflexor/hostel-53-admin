"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Medal, Award } from "lucide-react"
import { AnimatedNumber } from "./animated-number"

interface TopRoom {
  roomId: string
  roomName: string
  revenue: number
}

interface TopRoomsProps {
  rooms: TopRoom[]
}

const rankConfig = [
  { icon: Crown, color: "text-amber-500", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" },
  { icon: Medal, color: "text-slate-400", bgColor: "bg-slate-500/10", borderColor: "border-slate-400/30" },
  { icon: Award, color: "text-orange-600", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
]

export function TopRooms({ rooms }: TopRoomsProps) {
  if (rooms.length === 0) return null

  return (
    <Card className="border-0 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Лучшие комнаты по доходу</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rooms.map((room, index) => {
            const rank = rankConfig[index] || rankConfig[2]
            const Icon = rank.icon

            return (
              <div
                key={room.roomId}
                className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${rank.borderColor} ${rank.bgColor}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${rank.bgColor}`}>
                    <Icon className={`h-6 w-6 ${rank.color}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{room.roomName}</p>
                    <p className="text-sm text-muted-foreground">Место #{index + 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">
                    <AnimatedNumber value={room.revenue} />
                  </p>
                  <p className="text-sm text-muted-foreground">сом</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
