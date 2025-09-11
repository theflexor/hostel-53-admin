"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, X, Search, Filter, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { HostelAPI, type BookingDto, type RoomsDto } from "@/lib/api"

type BookingStatus = "active" | "cancelled" | "completed"

const statusLabels: Record<BookingStatus, string> = {
  active: "Активна",
  cancelled: "Отменена",
  completed: "Завершена",
}

const statusColors: Record<BookingStatus, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
}

function getBookingStatus(startTime: string, endTime: string): BookingStatus {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (end < now) return "completed"
  if (start <= now && now <= end) return "active"
  return "active" // Future bookings are considered active
}

export function BookingsTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roomFilter, setRoomFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState("")
  const [bookings, setBookings] = useState<BookingDto[]>([])
  const [rooms, setRooms] = useState<RoomsDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean
    booking: BookingDto | null
    loading: boolean
  }>({
    open: false,
    booking: null,
    loading: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [bookingsData, roomsData] = await Promise.all([HostelAPI.getAllBookings(), HostelAPI.getAllRooms()])
        setBookings(bookingsData)
        setRooms(roomsData)
        setError(null)
      } catch (err) {
        setError("Ошибка загрузки данных")
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const roomsMap = useMemo(() => {
    return rooms.reduce(
      (acc, room) => {
        acc[room.id] = room.title
        return acc
      },
      {} as Record<number, string>,
    )
  }, [rooms])

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const fullName = `${booking.firstName} ${booking.lastName}`
      const matchesSearch =
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) || booking.phone.includes(searchQuery)

      const bookingStatus = getBookingStatus(booking.startTime, booking.endTime)
      const matchesStatus = statusFilter === "all" || bookingStatus === statusFilter

      const roomName = roomsMap[booking.roomId] || `Комната ${booking.roomId}`
      const matchesRoom = roomFilter === "all" || roomName === roomFilter

      const checkInDate = booking.startTime.split("T")[0]
      const matchesDate = !dateFilter || checkInDate >= dateFilter

      return matchesSearch && matchesStatus && matchesRoom && matchesDate
    })
  }, [bookings, searchQuery, statusFilter, roomFilter, dateFilter, roomsMap])

  const handleEditBooking = (bookingId: number) => {
    console.log("Edit booking:", bookingId)
    // TODO: Implement edit functionality
  }

  const handleCancelBooking = (booking: BookingDto) => {
    setCancelDialog({
      open: true,
      booking,
      loading: false,
    })
  }

  const confirmCancelBooking = async () => {
    if (!cancelDialog.booking?.id) return

    setCancelDialog((prev) => ({ ...prev, loading: true }))

    try {
      await HostelAPI.updateBooking(cancelDialog.booking.id, {
        ...cancelDialog.booking,
        status: "cancelled",
      })

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === cancelDialog.booking?.id ? { ...booking, status: "cancelled" } : booking,
        ),
      )

      setCancelDialog({ open: false, booking: null, loading: false })
    } catch (err) {
      console.error("Failed to cancel booking:", err)
      setCancelDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const closeCancelDialog = () => {
    if (!cancelDialog.loading) {
      setCancelDialog({ open: false, booking: null, loading: false })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка бронирований...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-destructive">{error}</CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры и поиск
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по ФИО или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="cancelled">Отмененные</SelectItem>
                <SelectItem value="completed">Завершенные</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Комната" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все комнаты</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.title}>
                    {room.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Дата заезда от..."
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            Найдено бронирований: {filteredBookings.length} из {bookings.length}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№ брони</TableHead>
                  <TableHead>ФИО клиента</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Заезд</TableHead>
                  <TableHead>Выезд</TableHead>
                  <TableHead>Комната/Койка</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Бронирования не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBookings.map((booking) => {
                    const status = getBookingStatus(booking.startTime, booking.endTime)
                    const roomName = roomsMap[booking.roomId] || `Комната ${booking.roomId}`
                    const bunkInfo = booking.bunks
                      .map((bunk) => `Койка ${bunk.number} (${bunk.tier === "TOP" ? "верх" : "низ"})`)
                      .join(", ")

                    return (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">#{booking.id}</TableCell>
                        <TableCell>
                          {booking.firstName} {booking.lastName}
                        </TableCell>
                        <TableCell>{booking.phone}</TableCell>
                        <TableCell>{new Date(booking.startTime).toLocaleDateString("ru-RU")}</TableCell>
                        <TableCell>{new Date(booking.endTime).toLocaleDateString("ru-RU")}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{roomName}</div>
                            <div className="text-muted-foreground">{bunkInfo}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", statusColors[status])}>
                            {statusLabels[status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditBooking(booking.id!)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {status === "active" && booking.status !== "cancelled" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelBooking(booking)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={cancelDialog.open} onOpenChange={closeCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Отмена бронирования
            </DialogTitle>
            <DialogDescription>Вы уверены, что хотите отменить бронирование?</DialogDescription>
          </DialogHeader>

          {cancelDialog.booking && (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Бронирование:</span>
                  <div className="text-muted-foreground">#{cancelDialog.booking.id}</div>
                </div>
                <div>
                  <span className="font-medium">Гость:</span>
                  <div className="text-muted-foreground">
                    {cancelDialog.booking.firstName} {cancelDialog.booking.lastName}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Телефон:</span>
                  <div className="text-muted-foreground">{cancelDialog.booking.phone}</div>
                </div>
                <div>
                  <span className="font-medium">Даты:</span>
                  <div className="text-muted-foreground">
                    {new Date(cancelDialog.booking.startTime).toLocaleDateString("ru-RU")} -{" "}
                    {new Date(cancelDialog.booking.endTime).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">
                  Внимание: Отмененное бронирование нельзя будет восстановить.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeCancelDialog} disabled={cancelDialog.loading}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelBooking}
              disabled={cancelDialog.loading}
              className="min-w-[100px]"
            >
              {cancelDialog.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Отменяем...
                </>
              ) : (
                "Отменить бронь"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
