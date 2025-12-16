"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Home,
} from "lucide-react"
import { format, startOfDay, isSameDay } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  apiService,
  formatPrice,
  type Booking,
  type Room,
  type PriceCalculationDto,
} from "@/lib/api"
import { debounce } from "@/lib/utils"

interface RoomBunk {
  roomId: number
  roomName: string
  bunkId: number
  bunkName: string
  tier: number
  number: number
}

interface CellData {
  date: string
  roomBunk: RoomBunk
  booking?: Booking
  status: "available" | "occupied" | "soon-available"
}

interface BookingBlock {
  booking: Booking
  startDate: string
  endDate: string
  startIndex: number
  span: number
  roomBunk: RoomBunk
}

interface BookingFormData {
  guestName: string
  guestPhone: string
  guestEmail: string
  checkIn: Date | undefined
  checkOut: Date | undefined
  comment: string
}

interface BookingFormErrors {
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  checkIn?: string
  checkOut?: string
}

export function OccupancyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewPeriod, setViewPeriod] = useState(21)
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomBunks, setRoomBunks] = useState<RoomBunk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCell, setSelectedCell] = useState<{
    date: string
    roomBunk: RoomBunk
    booking?: Booking
  } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bookingFormData, setBookingFormData] = useState<BookingFormData>({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    checkIn: undefined,
    checkOut: undefined,
    comment: "",
  })
  const [bookingFormErrors, setBookingFormErrors] = useState<
    Record<string, string>
  >({})
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
  const [priceCalculation, setPriceCalculation] =
    useState<PriceCalculationDto | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [bookingsData, roomsData] = await Promise.all([
        apiService.getAllBookings(),
        apiService.getRooms(),
      ])

      setBookings(bookingsData)
      setRooms(roomsData)

      const bunks: RoomBunk[] = []
      for (const room of roomsData) {
        if (room.bunks && room.bunks.length > 0) {
          for (const bunk of room.bunks) {
            bunks.push({
              roomId: room.id,
              roomName: room.name,
              bunkId: bunk.id,
              bunkName: `Койка ${bunk.tier === 1 ? "нижняя" : "верхняя"}`,
              tier: bunk.tier,
              number: bunk.number,
            })
          }
        }
      }
      setRoomBunks(bunks)
      setUsingMockData(false)
    } catch (err) {
      console.error("Error loading calendar data:", err)
      setError("Не удалось загрузить данные календаря")
      setBookings([])
      setRooms([])
      setRoomBunks([])
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const dates = useMemo(() => {
    const startDate = new Date(currentDate)
    const daysToShow = Number.parseInt(viewPeriod.toString())
    startDate.setDate(startDate.getDate() - Math.floor(daysToShow / 3))

    const dateArray = []
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dateArray.push(date.toISOString().split("T")[0])
    }
    return dateArray
  }, [currentDate, viewPeriod])

  const filteredRoomBunks = useMemo(() => {
    if (selectedRoomId === null) {
      return roomBunks
    }
    return roomBunks.filter((rb) => rb.roomId === selectedRoomId)
  }, [roomBunks, selectedRoomId])

  // Optimized: Create lookup maps for O(1) access
  const bookingsByBunkAndDate = useMemo(() => {
    const map = new Map<string, Booking>()
    bookings.forEach((booking) => {
      if (booking.status === "confirmed" || booking.status === "checked_in") {
        // Create entries for each date in the booking range
        const startDate = new Date(booking.check_in_date)
        const endDate = new Date(booking.check_out_date)

        for (
          let d = new Date(startDate);
          d < endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dateStr = d.toISOString().split("T")[0]
          const key = `${booking.bunk_id}-${dateStr}`
          map.set(key, booking)
        }
      }
    })
    return map
  }, [bookings])

  const checkoutsByBunkAndDate = useMemo(() => {
    const map = new Map<string, Booking>()
    bookings.forEach((booking) => {
      if (booking.status === "confirmed" || booking.status === "checked_in") {
        const key = `${booking.bunk_id}-${booking.check_out_date}`
        map.set(key, booking)
      }
    })
    return map
  }, [bookings])

  const getBookingBlocks = useMemo(() => {
    const blocks: BookingBlock[] = []
    const processedBookings = new Set<string>()

    for (const roomBunk of filteredRoomBunks) {
      const roomBookings = bookings.filter(
        (b) =>
          b.bunk_id === roomBunk.bunkId &&
          (b.status === "confirmed" || b.status === "checked_in")
      )

      for (const booking of roomBookings) {
        const bookingKey = `${booking.id}-${booking.bunk_id}`
        if (processedBookings.has(bookingKey)) continue
        processedBookings.add(bookingKey)

        const startIndex = dates.findIndex(
          (date) => date >= booking.check_in_date
        )
        const endIndex = dates.findIndex(
          (date) => date >= booking.check_out_date
        )

        if (startIndex !== -1) {
          const span =
            endIndex !== -1 ? endIndex - startIndex : dates.length - startIndex
          if (span > 0) {
            blocks.push({
              booking,
              startDate: booking.check_in_date,
              endDate: booking.check_out_date,
              startIndex,
              span,
              roomBunk,
            })
          }
        }
      }
    }

    return blocks
  }, [bookings, filteredRoomBunks, dates])

  const isPastDate = useCallback((date: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    return checkDate < today
  }, [])

  const getCellData = useCallback(
    (date: string, roomBunk: RoomBunk): CellData => {
      // Optimized: O(1) lookup instead of O(n) find
      const key = `${roomBunk.bunkId}-${date}`
      const booking = bookingsByBunkAndDate.get(key)

      let status: "available" | "occupied" | "soon-available" = "available"

      if (booking) {
        status = "occupied"
      } else {
        // Check if someone is checking out today (before 12:00)
        // This means the bed will be available for new booking from 14:00 same day
        const checkoutToday = checkoutsByBunkAndDate.get(key)

        if (checkoutToday) {
          status = "soon-available"
        }
      }

      return {
        date,
        roomBunk,
        booking,
        status,
      }
    },
    [bookingsByBunkAndDate, checkoutsByBunkAndDate]
  )

  // State for cancel booking dialog
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean
    booking: Booking | null
    loading: boolean
  }>({ open: false, booking: null, loading: false })

  const handleCellClick = (cellData: CellData) => {
    setSelectedCell(cellData)
    setBookingFormData({
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      checkIn: new Date(cellData.date),
      checkOut: undefined,
      comment: "",
    })
    setIsDialogOpen(true)
  }

  const navigateWeek = useCallback(
    (direction: "prev" | "next") => {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
      setCurrentDate(newDate)
    },
    [currentDate]
  )

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const getDateRangeInfo = useMemo(() => {
    if (dates.length === 0) return { month: "", week: "", roomInfo: "" }

    const startDate = new Date(dates[0])
    const endDate = new Date(dates[dates.length - 1])

    const startMonth = startDate.toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
    })
    const endMonth = endDate.toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
    })

    const monthDisplay =
      startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`

    const getWeekOfMonth = (date: Date) => {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
      const firstWeekday = firstDay.getDay()
      const adjustedDate = date.getDate() + firstWeekday - 1
      return Math.ceil(adjustedDate / 7)
    }

    const startWeek = getWeekOfMonth(startDate)
    const endWeek = getWeekOfMonth(endDate)
    const weekDisplay =
      startWeek === endWeek
        ? `${startWeek} неделя`
        : `${startWeek}-${endWeek} недели`

    const selectedRoom = selectedRoomId
      ? rooms.find((r) => r.id === selectedRoomId)
      : null
    const roomInfo = selectedRoom ? selectedRoom.name : "Все комнаты"

    return { month: monthDisplay, week: weekDisplay, roomInfo }
  }, [dates, selectedRoomId, rooms])

  const getCellColor = (
    status: "available" | "occupied" | "soon-available",
    isPast = false
  ) => {
    if (isPast) {
      return "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-500 cursor-pointer"
    }

    switch (status) {
      case "available":
        return "bg-white hover:bg-blue-50 border-slate-200 text-slate-700 shadow-sm hover:shadow-md"
      case "occupied":
        return "bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-900 shadow-sm hover:shadow-md"
      case "soon-available":
        return "bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-900 shadow-sm hover:shadow-md border-l-4 border-l-orange-500"
      default:
        return "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 shadow-sm hover:shadow-md"
    }
  }

  const getStatusLabel = (
    status: "available" | "occupied" | "soon-available"
  ) => {
    switch (status) {
      case "available":
        return "Свободно"
      case "occupied":
        return "Занято"
      case "soon-available":
        return "Освобождается сегодня (до 12:00)"
      default:
        return "Неизвестно"
    }
  }

  const validateBookingForm = (): boolean => {
    const newErrors: BookingFormErrors = {}

    if (!bookingFormData.guestName.trim()) {
      newErrors.guestName = "ФИО обязательно для заполнения"
    }

    if (!bookingFormData.guestPhone.trim()) {
      newErrors.guestPhone = "Телефон обязателен для заполнения"
    } else if (!/^\+?[0-9\s\-()]{10,}$/.test(bookingFormData.guestPhone)) {
      newErrors.guestPhone = "Некорректный формат телефона"
    }

    if (!bookingFormData.guestEmail.trim()) {
      newErrors.guestEmail = "Email обязателен для заполнения"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingFormData.guestEmail)) {
      newErrors.guestEmail = "Некорректный формат email"
    }

    if (!bookingFormData.checkIn) {
      newErrors.checkIn = "Дата заезда обязательна"
    }

    if (!bookingFormData.checkOut) {
      newErrors.checkOut = "Дата выезда обязательна"
    }

    if (
      bookingFormData.checkIn &&
      bookingFormData.checkOut &&
      bookingFormData.checkIn >= bookingFormData.checkOut
    ) {
      newErrors.checkOut = "Дата выезда должна быть позже даты заезда"
    }

    setBookingFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateBookingFormData = (field: keyof BookingFormData, value: any) => {
    setBookingFormData((prev) => {
      // Only update if value actually changed
      if (prev[field] === value) return prev
      return { ...prev, [field]: value }
    })

    // Clear error only if it exists
    if (bookingFormErrors[field as keyof BookingFormErrors]) {
      setBookingFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const debouncedCalculatePrice = useMemo(
    () =>
      debounce(async (checkIn: Date, checkOut: Date, roomId: string) => {
        try {
          const selectedRoom = rooms.find((r) => r.id === roomId)
          if (!selectedRoom) return

          const checkInDate = format(checkIn, "yyyy-MM-dd")
          const checkOutDate = format(checkOut, "yyyy-MM-dd")

          const priceData = await apiService.calculatePrice(
            selectedRoom.categoryId,
            1,
            1,
            checkInDate,
            checkOutDate
          )
          setPriceCalculation(priceData)
        } catch (error) {
          console.error("Error calculating price:", error)
          setPriceCalculation(null)
        }
      }, 500),
    [rooms]
  )

  useEffect(() => {
    if (
      !bookingFormData.checkIn ||
      !bookingFormData.checkOut ||
      !selectedCell?.roomBunk.roomId
    ) {
      setPriceCalculation(null)
      return
    }

    debouncedCalculatePrice(
      bookingFormData.checkIn,
      bookingFormData.checkOut,
      selectedCell.roomBunk.roomId
    )
  }, [
    bookingFormData.checkIn,
    bookingFormData.checkOut,
    selectedCell?.roomBunk.roomId,
    debouncedCalculatePrice,
  ])

  const handleCreateBooking = async () => {
    if (
      !bookingFormData.guestName ||
      !bookingFormData.guestPhone ||
      !bookingFormData.guestEmail ||
      !bookingFormData.checkIn ||
      !bookingFormData.checkOut ||
      !selectedCell
    ) {
      alert("Пожалуйста, заполните все поля")
      return
    }

    if (isPastDate(bookingFormData.checkIn.toISOString().split("T")[0])) {
      const confirmed = confirm(
        "⚠️ Внимание! Вы создаете бронирование на прошедшую дату. Продолжить?"
      )
      if (!confirmed) {
        return
      }
    }

    setIsSubmittingBooking(true)
    try {
      const [firstName, ...lastNameParts] = bookingFormData.guestName
        .trim()
        .split(" ")
      const lastName = lastNameParts.join(" ") || ""

      const checkInWithTime = new Date(bookingFormData.checkIn)
      checkInWithTime.setHours(14, 0, 0, 0) // 14:00 заселение

      const checkOutWithTime = new Date(bookingFormData.checkOut)
      checkOutWithTime.setHours(12, 0, 0, 0) // 12:00 выселение

      const bookingData = {
        firstName,
        lastName,
        email: bookingFormData.guestEmail,
        phone: bookingFormData.guestPhone,
        guests: 1,
        roomId: selectedCell.roomBunk.roomId,
        startTime: checkInWithTime.toISOString(),
        endTime: checkOutWithTime.toISOString(),
        comments: bookingFormData.comment,
        bunkIds: [selectedCell.roomBunk.bunkId],
        price: priceCalculation?.discountedPrice || 0,
        discountPercentage: priceCalculation?.discountPercentage || 0,
        discountAmount: priceCalculation?.discountAmount || 0,
        originalPrice: priceCalculation?.originalPrice || 0,
        discountedPrice: priceCalculation?.discountedPrice || 0,
      }

      await apiService.createBooking(bookingData)
      await loadData()
      setIsDialogOpen(false)
      setSelectedCell(null)
      setBookingFormData({
        guestName: "",
        guestPhone: "",
        guestEmail: "",
        checkIn: undefined,
        checkOut: undefined,
        comment: "",
      })
      setBookingFormErrors({})
      setPriceCalculation(null)
    } catch (error) {
      console.error("Error creating booking:", error)
      setBookingFormErrors({
        guestName: "Ошибка при создании бронирования. Попробуйте еще раз.",
      })
    } finally {
      setIsSubmittingBooking(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!cancelDialog.booking) return

    setCancelDialog((prev) => ({ ...prev, loading: true }))
    try {
      await apiService.cancelBooking(cancelDialog.booking.id)
      await loadData()
      setCancelDialog({ open: false, booking: null, loading: false })
      setIsDialogOpen(false)
      setSelectedCell(null)
    } catch (error) {
      console.error("Error cancelling booking:", error)
      alert("Не удалось отменить бронирование. Попробуйте еще раз.")
      setCancelDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const isDateRangeAvailable = useCallback(
    (bunkId: number, checkIn: Date, checkOut: Date): boolean => {
      const checkInStr = format(checkIn, "yyyy-MM-dd")
      const checkOutStr = format(checkOut, "yyyy-MM-dd")

      return !bookings.some(
        (booking) =>
          booking.bunk_id === bunkId &&
          (booking.status === "confirmed" || booking.status === "checked_in") &&
          !(
            checkOutStr <= booking.check_in_date ||
            checkInStr >= booking.check_out_date
          )
      )
    },
    [bookings]
  )

  const getOccupiedDates = useCallback(
    (bunkId: number): Date[] => {
      const occupiedDates: Date[] = []

      bookings.forEach((booking) => {
        if (
          booking.bunk_id === bunkId &&
          (booking.status === "confirmed" || booking.status === "checked_in")
        ) {
          const start = new Date(booking.check_in_date)
          const end = new Date(booking.check_out_date)

          for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            occupiedDates.push(new Date(d))
          }
        }
      })

      return occupiedDates
    },
    [bookings]
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка календаря...</span>
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
            <div className="font-semibold">Ошибка загрузки календаря</div>
            <div className="text-sm">{error}</div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 bg-transparent"
              onClick={loadData}
            >
              Попробовать снова
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                  Календарь занятости
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-blue-100 text-blue-800"
                  >
                    {bookings.length} бронирований
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-medium text-blue-700">
                    {getDateRangeInfo.month}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span>{getDateRangeInfo.week}</span>
                  <span className="text-slate-500">•</span>
                  <span className="font-medium text-slate-700">
                    {getDateRangeInfo.roomInfo}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRoomId || ""}
                    onChange={(e) =>
                      setSelectedRoomId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-md bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Все комнаты</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek("prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="flex items-center gap-1 bg-transparent hover:bg-blue-50"
                  >
                    <Home className="h-3 w-3" />
                    Сегодня
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateWeek("next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewPeriod(7)}
                    className={cn(
                      "text-xs",
                      viewPeriod === 7 &&
                        "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    Неделя
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewPeriod(14)}
                    className={cn(
                      "text-xs",
                      viewPeriod === 14 &&
                        "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    2 недели
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewPeriod(21)}
                    className={cn(
                      "text-xs",
                      viewPeriod === 21 &&
                        "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    3 недели
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewPeriod(30)}
                    className={cn(
                      "text-xs",
                      viewPeriod === 30 &&
                        "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                  >
                    Месяц
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <div className="min-w-[800px]">
                {/* Legend */}
                <div className="p-4 border-b bg-slate-50 space-y-3">
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-white border border-slate-300 rounded shadow-sm"></div>
                      <span className="text-sm">Свободно</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded shadow-sm"></div>
                      <span className="text-sm">Занято</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-50 border border-orange-300 border-l-4 border-l-orange-500 rounded shadow-sm"></div>
                      <span className="text-sm">Выезд сегодня (до 12:00)</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded p-2">
                    💡{" "}
                    <span className="font-medium">
                      Заезд с 14:00, выезд до 12:00.
                    </span>{" "}
                    Койка освобождается в день выезда и может быть забронирована
                    для нового гостя с того же дня.
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="relative">
                  {/* Header with dates */}
                  <div className="sticky top-0 bg-white border-b z-10">
                    <div className="flex">
                      <div className="w-48 px-4 py-3 font-semibold text-sm text-slate-700 bg-slate-50 border-r">
                        Комната / Койка
                      </div>
                      <div className="flex flex-1">
                        {dates.map((date) => {
                          const isToday = isSameDay(new Date(), new Date(date))
                          const isPast = isPastDate(date)
                          return (
                            <div
                              key={date}
                              className={cn(
                                "flex-1 min-w-[80px] px-2 py-3 text-center text-sm border-r bg-slate-50",
                                isToday &&
                                  !isPast &&
                                  "bg-blue-50 font-semibold text-blue-700",
                                isPast && "bg-gray-100 text-gray-400"
                              )}
                            >
                              <div className="font-medium">
                                {format(new Date(date), "dd")}
                              </div>
                              <div className="text-xs text-slate-500">
                                {format(new Date(date), "EEE", { locale: ru })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Room rows */}
                  <div className="divide-y">
                    {filteredRoomBunks.map((roomBunk, rowIndex) => (
                      <div
                        key={roomBunk.bunkId}
                        className="flex hover:bg-slate-25 relative"
                      >
                        <div className="w-48 px-4 py-4 bg-white border-r sticky left-0 z-10 shadow-sm">
                          {/* Название комнаты */}
                          <div className="font-semibold text-slate-800 text-sm mb-2">
                            {roomBunk.roomName}
                          </div>

                          {/* Инфо о койке */}
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            {/* Иконка кровати */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 12h16M4 6h16M4 18h16"
                              />
                            </svg>
                            <span>
                              {roomBunk.bunkName}{" "}
                              <span className="font-semibold">
                                №{roomBunk.number}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-1 relative">
                          {dates.map((date) => {
                            const cellData = getCellData(date, roomBunk)
                            const isToday = isSameDay(
                              new Date(),
                              new Date(date)
                            )
                            const isPast = isPastDate(date)

                            return (
                              <button
                                key={date}
                                className={cn(
                                  "flex-1 min-w-[80px] h-20 border-r border-slate-200 transition-all duration-200 relative group",
                                  !cellData.booking &&
                                    getCellColor(cellData.status, isPast),
                                  isToday &&
                                    !isPast &&
                                    "ring-2 ring-blue-400 ring-inset"
                                )}
                                onClick={() => handleCellClick(cellData)}
                              >
                                {!cellData.booking && !isPast && (
                                  <div className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center">
                                    Забронировать
                                  </div>
                                )}
                                {!cellData.booking && isPast && (
                                  <div className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center">
                                    Забронировать
                                  </div>
                                )}
                              </button>
                            )
                          })}

                          {getBookingBlocks
                            .filter(
                              (block) =>
                                block.roomBunk.bunkId === roomBunk.bunkId
                            )
                            .map((block) => (
                              <Tooltip
                                key={`${block.booking.id}-${block.roomBunk.bunkId}`}
                              >
                                <TooltipTrigger asChild>
                                  <button
                                    className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 border border-blue-300 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 z-10 group"
                                    style={{
                                      left: `${
                                        (block.startIndex * 100) / dates.length
                                      }%`,
                                      width: `${
                                        (block.span * 100) / dates.length
                                      }%`,
                                    }}
                                    onClick={() =>
                                      handleCellClick({
                                        date: block.startDate,
                                        roomBunk: block.roomBunk,
                                        booking: block.booking,
                                      })
                                    }
                                  >
                                    <div className="px-3 py-2 h-full flex flex-col justify-center">
                                      <div className="text-sm font-semibold text-blue-900 truncate">
                                        {block.booking.guest_name}
                                      </div>
                                      <div className="text-xs text-blue-700 font-medium">
                                        {formatPrice(
                                          block.booking.total_price || 0
                                        )}
                                      </div>
                                      <div className="text-xs text-blue-600 opacity-75">
                                        {format(
                                          new Date(block.startDate),
                                          "dd.MM"
                                        )}{" "}
                                        -{" "}
                                        {format(
                                          new Date(block.endDate),
                                          "dd.MM"
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs bg-white border border-slate-200 shadow-lg"
                                >
                                  <div className="space-y-2 p-1">
                                    <div className="font-semibold text-slate-900">
                                      {block.booking.guest_name}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      📞 {block.booking.guest_phone}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      📅{" "}
                                      {format(
                                        new Date(block.booking.check_in_date),
                                        "dd.MM.yyyy"
                                      )}{" "}
                                      -{" "}
                                      {format(
                                        new Date(block.booking.check_out_date),
                                        "dd.MM.yyyy"
                                      )}
                                    </div>
                                    <div className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                      💰{" "}
                                      {formatPrice(
                                        block.booking.total_price || 0
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Статус:{" "}
                                      {block.booking.status === "confirmed"
                                        ? "Подтверждено"
                                        : "Заселен"}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg bg-white border-0 shadow-2xl rounded-xl overflow-hidden">
            <DialogHeader className="bg-gradient-to-r from-blue-50 to-slate-50 px-6 py-4 border-b border-slate-100">
              <DialogTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                {selectedCell?.booking ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Информация о бронировании
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Создать бронирование
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedCell && (
              <div className="p-6 space-y-6">
                {selectedCell.booking ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {selectedCell.booking.guest_name
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900 text-lg">
                            {selectedCell.roomBunk.roomName}
                          </h4>
                          <p className="text-blue-700 text-sm">
                            {selectedCell.roomBunk.bunkName}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">👤</span>
                            <div>
                              <div className="font-medium text-slate-700">
                                Гость
                              </div>
                              <div className="text-slate-600">
                                {selectedCell.booking.guest_name}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">📞</span>
                            <div>
                              <div className="font-medium text-slate-700">
                                Телефон
                              </div>
                              <div className="text-slate-600">
                                {selectedCell.booking.guest_phone}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">📅</span>
                            <div>
                              <div className="font-medium text-slate-700">
                                Заезд
                              </div>
                              <div className="text-slate-600">
                                {format(
                                  new Date(selectedCell.booking.check_in_date),
                                  "dd.MM.yyyy"
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600">📅</span>
                            <div>
                              <div className="font-medium text-slate-700">
                                Выезд
                              </div>
                              <div className="text-slate-600">
                                {format(
                                  new Date(selectedCell.booking.check_out_date),
                                  "dd.MM.yyyy"
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-700">
                            Стоимость
                          </span>
                          <span className="text-xl font-bold text-blue-700">
                            {formatPrice(selectedCell.booking.total_price || 0)}
                          </span>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Статус:{" "}
                          {selectedCell.booking.status === "confirmed"
                            ? "Подтверждено"
                            : "Заселен"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                          <Home className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {selectedCell.roomBunk.roomName}
                          </div>
                          <div className="text-sm text-slate-600">
                            {selectedCell.roomBunk.bunkName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(
                              new Date(selectedCell.date),
                              "dd MMMM yyyy",
                              { locale: ru }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">ФИО гостя *</Label>
                        <Input
                          id="name"
                          value={bookingFormData.guestName}
                          onChange={(e) =>
                            updateBookingFormData("guestName", e.target.value)
                          }
                          placeholder="Введите полное имя"
                          className={
                            bookingFormErrors.guestName ? "border-red-500" : ""
                          }
                        />
                        {bookingFormErrors.guestName && (
                          <p className="text-xs text-red-600 mt-1">
                            {bookingFormErrors.guestName}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone">Телефон *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={bookingFormData.guestPhone}
                          onChange={(e) =>
                            updateBookingFormData("guestPhone", e.target.value)
                          }
                          placeholder="+996 XXX XXX XXX"
                          className={
                            bookingFormErrors.guestPhone ? "border-red-500" : ""
                          }
                        />
                        {bookingFormErrors.guestPhone && (
                          <p className="text-xs text-red-600 mt-1">
                            {bookingFormErrors.guestPhone}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={bookingFormData.guestEmail}
                          onChange={(e) =>
                            updateBookingFormData("guestEmail", e.target.value)
                          }
                          placeholder="example@mail.com"
                          className={
                            bookingFormErrors.guestEmail ? "border-red-500" : ""
                          }
                        />
                        {bookingFormErrors.guestEmail && (
                          <p className="text-xs text-red-600 mt-1">
                            {bookingFormErrors.guestEmail}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Дата заезда (14:00)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !bookingFormData.checkIn &&
                                    "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {bookingFormData.checkIn
                                  ? format(
                                      bookingFormData.checkIn,
                                      "dd.MM.yyyy"
                                    )
                                  : "Выберите"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={bookingFormData.checkIn}
                                onSelect={(date) =>
                                  updateBookingFormData("checkIn", date)
                                }
                                disabled={(date) => {
                                  if (date < startOfDay(new Date())) return true

                                  if (selectedCell?.roomBunk.bunkId) {
                                    const occupiedDates = getOccupiedDates(
                                      selectedCell.roomBunk.bunkId
                                    )
                                    return occupiedDates.some((occupiedDate) =>
                                      isSameDay(date, occupiedDate)
                                    )
                                  }

                                  return false
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <Label>Дата выезда (12:00)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !bookingFormData.checkOut &&
                                    "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {bookingFormData.checkOut
                                  ? format(
                                      bookingFormData.checkOut,
                                      "dd.MM.yyyy"
                                    )
                                  : "Выберите"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={bookingFormData.checkOut}
                                onSelect={(date) =>
                                  updateBookingFormData("checkOut", date)
                                }
                                disabled={(date) => {
                                  if (
                                    date <=
                                    (bookingFormData.checkIn || new Date())
                                  )
                                    return true

                                  if (
                                    selectedCell?.roomBunk.bunkId &&
                                    bookingFormData.checkIn
                                  ) {
                                    // Check if the entire range from check-in to this date is available
                                    return !isDateRangeAvailable(
                                      selectedCell.roomBunk.bunkId,
                                      bookingFormData.checkIn,
                                      date
                                    )
                                  }

                                  return false
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="comment">Комментарий</Label>
                        <Textarea
                          id="comment"
                          value={bookingFormData.comment}
                          onChange={(e) =>
                            updateBookingFormData("comment", e.target.value)
                          }
                          placeholder="Дополнительная информация..."
                          rows={2}
                        />
                      </div>

                      {priceCalculation && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              Стоимость:
                            </span>
                            <div className="text-right">
                              {priceCalculation.discountAmount > 0 && (
                                <div className="text-xs text-gray-500 line-through">
                                  {formatPrice(priceCalculation.originalPrice)}
                                </div>
                              )}
                              <div className="text-lg font-bold text-blue-700">
                                {formatPrice(priceCalculation.discountedPrice)}
                              </div>
                            </div>
                          </div>

                          {priceCalculation.discountAmount > 0 && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-blue-600">
                                Скидка ({priceCalculation.discountPercentage}%):
                              </span>
                              <span className="font-semibold text-green-600">
                                -{formatPrice(priceCalculation.discountAmount)}
                              </span>
                            </div>
                          )}

                          {bookingFormData.checkIn &&
                            bookingFormData.checkOut && (
                              <div className="text-xs text-blue-600 pt-1 border-t border-blue-200">
                                {Math.ceil(
                                  (bookingFormData.checkOut.getTime() -
                                    bookingFormData.checkIn.getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                ночь(ей)
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="px-6 hover:bg-slate-50"
                  >
                    {selectedCell.booking ? "Закрыть" : "Отмена"}
                  </Button>
                  {!selectedCell.booking && (
                    <Button
                      onClick={handleCreateBooking}
                      disabled={isSubmittingBooking}
                      className="px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      {isSubmittingBooking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание...
                        </>
                      ) : (
                        "Создать бронирование"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
