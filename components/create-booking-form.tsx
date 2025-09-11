"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CalendarIcon,
  Bed,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  apiService,
  formatPrice,
  type RoomsDto,
  type AvailableBunksDto,
  type CategoryDto,
  type PriceCalculationDto,
} from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface BookingFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  guests: number
  checkIn: Date | undefined
  checkOut: Date | undefined
  roomId: number | null
  selectedBunkIds: number[]
  comments: string
}

export function CreateBookingForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<BookingFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    guests: 1,
    checkIn: undefined,
    checkOut: undefined,
    roomId: null,
    selectedBunkIds: [],
    comments: "",
  })

  const [rooms, setRooms] = useState<RoomsDto[]>([])
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [availableBunks, setAvailableBunks] = useState<AvailableBunksDto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBunks, setLoadingBunks] = useState(false)
  const [priceCalculation, setPriceCalculation] =
    useState<PriceCalculationDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null)
        const [roomsData, categoriesData] = await Promise.all([
          apiService.getRooms(),
          apiService.getAllCategories(),
        ])
        setRooms(roomsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Failed to load data:", error)
        setError("Не удалось загрузить данные о комнатах")
        setRooms([])
        setCategories([])
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (formData.roomId && formData.checkIn && formData.checkOut) {
      loadAvailableBunks()
    } else {
      setAvailableBunks([])
      setFormData((prev) => ({ ...prev, selectedBunkIds: [] }))
    }
  }, [formData.roomId, formData.checkIn, formData.checkOut])

  useEffect(() => {
    if (
      formData.roomId &&
      formData.selectedBunkIds.length > 0 &&
      formData.checkIn &&
      formData.checkOut
    ) {
      calculatePrice()
    } else {
      setPriceCalculation(null)
    }
  }, [
    formData.roomId,
    formData.selectedBunkIds,
    formData.guests,
    formData.checkIn,
    formData.checkOut,
  ])

  const loadAvailableBunks = async () => {
    if (!formData.roomId || !formData.checkIn || !formData.checkOut) return

    setLoadingBunks(true)
    try {
      const startTime = formData.checkIn.toISOString()
      const endTime = formData.checkOut.toISOString()
      const bunks = await apiService.getAvailableBunks(
        formData.roomId,
        startTime,
        endTime
      )
      setAvailableBunks(bunks)
    } catch (error) {
      console.error("Failed to load available bunks:", error)
      setAvailableBunks([])
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить доступные койки",
        variant: "destructive",
      })
    } finally {
      setLoadingBunks(false)
    }
  }

  const calculatePrice = async () => {
    if (
      !formData.roomId ||
      formData.selectedBunkIds.length === 0 ||
      !formData.checkIn ||
      !formData.checkOut
    )
      return

    try {
      const selectedRoom = rooms.find((r) => r.id === formData.roomId)
      if (!selectedRoom) return

      const category = categories.find((c) => c.id === selectedRoom.categoryId)
      if (!category) return

      const checkInDate = format(formData.checkIn, "yyyy-MM-dd")
      const checkOutDate = format(formData.checkOut, "yyyy-MM-dd")

      const priceData = await apiService.calculatePrice(
        category.id,
        formData.selectedBunkIds.length,
        formData.guests,
        checkInDate,
        checkOutDate
      )
      setPriceCalculation(priceData)
    } catch (error) {
      console.error("Failed to calculate price:", error)
      setPriceCalculation(null)
      toast({
        title: "Ошибка",
        description: "Не удалось рассчитать стоимость",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.roomId ||
      formData.selectedBunkIds.length === 0 ||
      !formData.checkIn ||
      !formData.checkOut
    ) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const bookingData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        guests: formData.guests,
        roomId: formData.roomId,
        startTime: formData.checkIn.toISOString(),
        endTime: formData.checkOut.toISOString(),
        comments: formData.comments,
        bunkIds: formData.selectedBunkIds,
      }

      await apiService.createBooking(bookingData)

      toast({
        title: "Успешно!",
        description: "Бронирование создано успешно",
      })

      router.push("/bookings")
    } catch (error) {
      console.error("Failed to create booking:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать бронирование",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedRoom = rooms.find((r) => r.id === formData.roomId)
  const availableBunksCount = availableBunks.filter((b) => b.available).length

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-2 py-8">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div className="text-red-800">
            <div className="font-semibold">Ошибка загрузки</div>
            <div className="text-sm">{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Информация о госте
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Имя *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Фамилия *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Телефон *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="guests">Количест��о гостей</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                max="10"
                value={formData.guests}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    guests: Number.parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Даты проживания
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Дата заезда *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.checkIn && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.checkIn
                        ? format(formData.checkIn, "dd MMMM yyyy", {
                            locale: ru,
                          })
                        : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.checkIn}
                      onSelect={(date) =>
                        setFormData((prev) => ({ ...prev, checkIn: date }))
                      }
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Дата выезда *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.checkOut && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.checkOut
                        ? format(formData.checkOut, "dd MMMM yyyy", {
                            locale: ru,
                          })
                        : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.checkOut}
                      onSelect={(date) =>
                        setFormData((prev) => ({ ...prev, checkOut: date }))
                      }
                      disabled={(date) =>
                        date <= (formData.checkIn || new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Выбор комнаты
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    formData.roomId === room.id
                      ? "ring-2 ring-primary bg-primary/5"
                      : ""
                  )}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      roomId: room.id,
                      selectedBunkIds: [],
                    }))
                  }
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{room.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {room.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          {room.capacity} коек
                        </span>
                        <span className="font-semibold text-primary">
                          {formatPrice(room.price)}/ночь
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.map((amenity) => (
                          <Badge
                            key={amenity}
                            variant="secondary"
                            className="text-xs"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bunks Selection */}
        {formData.roomId && formData.checkIn && formData.checkOut && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5" />
                Выбор коек
                {loadingBunks && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              {selectedRoom && (
                <p className="text-sm text-muted-foreground">
                  {selectedRoom.title} • Доступно: {availableBunksCount} из{" "}
                  {availableBunks.length} коек
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loadingBunks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Загрузка доступных коек...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableBunks.map((bunk) => (
                    <Card
                      key={bunk.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        !bunk.available && "opacity-50 cursor-not-allowed",
                        bunk.available &&
                          formData.selectedBunkIds.includes(bunk.id)
                          ? "ring-2 ring-primary bg-primary/5"
                          : bunk.available
                          ? "hover:shadow-md"
                          : ""
                      )}
                      onClick={() => {
                        if (!bunk.available) return
                        setFormData((prev) => ({
                          ...prev,
                          selectedBunkIds: prev.selectedBunkIds.includes(
                            bunk.id
                          )
                            ? prev.selectedBunkIds.filter(
                                (id) => id !== bunk.id
                              )
                            : [...prev.selectedBunkIds, bunk.id],
                        }))
                      }}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center">
                            {bunk.available ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">
                              Койка {bunk.number}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {bunk.tier === "BOTTOM" ? "Нижняя" : "Верхняя"}
                            </div>
                          </div>
                          <Badge
                            variant={bunk.available ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {bunk.available ? "Доступна" : "Занята"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Price Estimation */}
        {priceCalculation && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-800 font-semibold">
                    Стоимость проживания:
                  </span>
                  <div className="text-right">
                    {priceCalculation.discountAmount > 0 && (
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(priceCalculation.originalPrice)}
                      </div>
                    )}
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(priceCalculation.discountedPrice)}
                    </div>
                  </div>
                </div>

                {priceCalculation.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">
                      Скидка ({priceCalculation.discountPercentage}%):
                    </span>
                    <span className="font-semibold text-green-600">
                      -{formatPrice(priceCalculation.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="text-xs text-green-700 pt-2 border-t border-green-200">
                  {formData.selectedBunkIds.length} койка(и) • {formData.guests}{" "}
                  гост(я/ей)
                  {formData.checkIn && formData.checkOut && (
                    <span>
                      {" "}
                      •{" "}
                      {Math.ceil(
                        (formData.checkOut.getTime() -
                          formData.checkIn.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      ночь(ей)
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Комментарии</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Дополнительные пожелания или комментарии..."
              value={formData.comments}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, comments: e.target.value }))
              }
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={
              loading ||
              !formData.roomId ||
              formData.selectedBunkIds.length === 0
            }
            className="flex-1"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Создать бронирование
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/bookings")}
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  )
}
