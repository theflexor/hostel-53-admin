const API_BASE_URL = "http://109.205.178.197:8080/api/v1"

// Types based on OpenAPI schema
export interface BookingDto {
  id?: number
  roomId: number
  startTime: string
  endTime: string
  comments?: string
  bunks: BunkResponseDto[]
  firstName: string
  lastName: string
  email: string
  phone: string
  guests: number
  price: number
}

export interface CreateBookingDto {
  firstName: string
  lastName: string
  email: string
  phone: string
  guests: number
  roomId: number
  startTime: string
  endTime: string
  comments?: string
  bunkIds: number[]
}

export interface RoomsDto {
  id: number
  title: string
  description: string
  capacity: number
  price: number
  beds: string
  roomSize: number
  categoryId: number
  categoryName: string
  amenities: string[]
  pictureUrls: string[]
}

export interface BunkResponseDto {
  id: number
  number: number
  tier: "TOP" | "BOTTOM"
  roomId: number
}

export interface AvailableBunksDto {
  id: number
  number: number
  tier: "TOP" | "BOTTOM"
  available: boolean
  bookedPeriods: BookingPeriod[]
}

export interface BookingPeriod {
  start: string
  end: string
}

export interface CategoryDto {
  id: number
  category: string
  price: number
  roomIds: number[]
}

export interface PriceCalculationDto {
  originalPrice: number
  discountedPrice: number
  discountAmount: number
  discountPercentage: number
}

// Type aliases to match calendar component expectations
export type Booking = BookingDto & {
  guest_name: string
  guest_phone: string
  check_in_date: string
  check_out_date: string
  bunk_id: number
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled"
  total_price?: number
}

export type Room = RoomsDto & {
  name: string
  bunks?: Array<{
    id: number
    tier: number
    number: number
  }>
}

export type Bunk = BunkResponseDto

// API Service Functions
export class HostelAPI {
  // Bookings
  static async getAllBookings(): Promise<BookingDto[]> {
    const response = await fetch(`${API_BASE_URL}/bookings/get-all-bookings`)
    if (!response.ok) throw new Error("Failed to fetch bookings")
    return response.json()
  }

  static async createBooking(booking: CreateBookingDto): Promise<BookingDto> {
    const response = await fetch(`${API_BASE_URL}/bookings/create-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    })
    if (!response.ok) throw new Error("Failed to create booking")
    return response.json()
  }

  static async updateBooking(
    id: number,
    booking: BookingDto
  ): Promise<BookingDto> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/update-booking/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      }
    )
    if (!response.ok) throw new Error("Failed to update booking")
    return response.json()
  }

  // Rooms
  static async getAllRooms(): Promise<RoomsDto[]> {
    const response = await fetch(`${API_BASE_URL}/rooms`)
    if (!response.ok) throw new Error("Failed to fetch rooms")
    return response.json()
  }

  static async getRoom(id: number): Promise<RoomsDto> {
    const response = await fetch(`${API_BASE_URL}/rooms/get-room/${id}`)
    if (!response.ok) throw new Error("Failed to fetch room")
    return response.json()
  }

  // Bunks
  static async getBunksByRoom(roomId: number): Promise<BunkResponseDto[]> {
    const response = await fetch(
      `${API_BASE_URL}/bunks/get-bunks?roomId=${roomId}`
    )
    if (!response.ok) throw new Error("Failed to fetch bunks")
    return response.json()
  }

  static async getAvailableBunks(
    roomId: number,
    startTime: string,
    endTime: string
  ): Promise<AvailableBunksDto[]> {
    const params = new URLSearchParams({
      roomId: roomId.toString(),
      startTime,
      endTime,
    })
    const response = await fetch(
      `${API_BASE_URL}/bunks/get-available-bunks?${params}`
    )
    if (!response.ok) throw new Error("Failed to fetch available bunks")
    return response.json()
  }

  // Categories
  static async getAllCategories(): Promise<CategoryDto[]> {
    const response = await fetch(`${API_BASE_URL}/categories`)
    if (!response.ok) throw new Error("Failed to fetch categories")
    return response.json()
  }

  static async calculatePrice(
    categoryId: number,
    bedsCount: number,
    guestsCount: number,
    checkInDate: string,
    checkOutDate: string
  ): Promise<PriceCalculationDto> {
    const params = new URLSearchParams({
      categoryId: categoryId.toString(),
      bedsCount: bedsCount.toString(),
      guestsCount: guestsCount.toString(),
      checkInDate,
      checkOutDate,
    })
    const response = await fetch(
      `${API_BASE_URL}/bookings/calculate-price?${params}`
    )
    if (!response.ok) throw new Error("Failed to calculate price")
    return response.json()
  }
}

export const apiService = {
  async getAllBookings(): Promise<Booking[]> {
    const bookings = await HostelAPI.getAllBookings()
    // Transform BookingDto to Booking format expected by calendar
    return bookings.map((booking) => ({
      ...booking,
      guest_name: `${booking.firstName} ${booking.lastName}`,
      guest_phone: booking.phone,
      check_in_date: booking.startTime.split("T")[0],
      check_out_date: booking.endTime.split("T")[0],
      bunk_id: booking.bunks[0]?.id || 0,
      status: "confirmed" as const, // Default status since API doesn't provide it
      total_price: booking.price, // Will be calculated separately if needed
    }))
  },

  async getRooms(): Promise<Room[]> {
    const rooms = await HostelAPI.getAllRooms()
    // Transform RoomsDto to Room format and get bunks for each room
    const roomsWithBunks = await Promise.all(
      rooms.map(async (room) => {
        try {
          const bunks = await HostelAPI.getBunksByRoom(room.id)
          return {
            ...room,
            name: room.title,
            bunks: bunks.map((bunk) => ({
              id: bunk.id,
              tier: bunk.tier === "BOTTOM" ? 1 : 2,
              number: bunk.number,
            })),
          }
        } catch (error) {
          console.error(`Failed to fetch bunks for room ${room.id}:`, error)
          return {
            ...room,
            name: room.title,
            bunks: [],
          }
        }
      })
    )
    return roomsWithBunks
  },

  async createBooking(booking: CreateBookingDto): Promise<Booking> {
    const created = await HostelAPI.createBooking(booking)
    return {
      ...created,
      guest_name: `${created.firstName} ${created.lastName}`,
      guest_phone: created.phone,
      check_in_date: created.startTime.split("T")[0],
      check_out_date: created.endTime.split("T")[0],
      bunk_id: created.bunks[0]?.id || 0,
      status: "confirmed" as const,
      total_price: undefined,
    }
  },

  async getAvailableBunks(
    roomId: number,
    startTime: string,
    endTime: string
  ): Promise<AvailableBunksDto[]> {
    return HostelAPI.getAvailableBunks(roomId, startTime, endTime)
  },

  async getAllCategories(): Promise<CategoryDto[]> {
    return HostelAPI.getAllCategories()
  },

  async calculatePrice(
    categoryId: number,
    bedsCount: number,
    guestsCount: number,
    checkInDate: string,
    checkOutDate: string
  ): Promise<PriceCalculationDto> {
    return HostelAPI.calculatePrice(
      categoryId,
      bedsCount,
      guestsCount,
      checkInDate,
      checkOutDate
    )
  },
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "KGS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(price)
    .replace("KGS", "сом")
    .replace(/\s/g, " ")
}
