const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

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
  bookingSource?: "RECEPTION" | "WEBSITE"
  price?: number
  discountPercentage?: number
  discountAmount?: number
  originalPrice?: number
  discountedPrice?: number
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

// Rooms
export interface CreateRoomDto {
  title: string
  description: string
  capacity: number
  beds: string
  roomSize: number
  categoryId: number
  amenityIds: number[]
  pictureUrls: string[]
}

// Categories
export interface CreateCategoryDto {
  category: string
  price: number
  roomIds?: number[]
}

// Bunks
export interface BunkRequestDto {
  number: number
  tier: "TOP" | "BOTTOM"
  roomId: number
}

// Amenities
export interface AmenityDto {
  amenity: string
  amenityId: number
}

export interface CreateAmenityDto {
  amenity: string
}

// Pictures
export interface PictureDto {
  id: number
  url: string
  roomId: number
}

// Reviews
export interface Review {
  id: number
  createdAt: string
  updatedAt: string
  name: string
  email: string
  rating: number
  comment: string
}

export interface ReviewRequestDto {
  name: string
  email: string
  rating: number
  comment: string
}

// Contact Messages
export interface ContactMessage {
  id: number
  firstName: string
  lastName: string
  phone: string
  email: string
  subject: string
  message: string
}

export interface ContactMessageDto {
  firstName: string
  lastName: string
  phone: string
  email: string
  subject: string
  message: string
}

// Authentication
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResponse {
  email: string
  role: "USER" | "ADMIN"
  id: number
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenRequest {
  token: string
}

// Admin Analytics
export interface AnalyticsRequest {
  startDate: string
  endDate: string
}

// Legacy API Response (current backend structure)
export interface LegacySummaryStatsResponse {
  totalRevenue: number
  potentialLostRevenue: number
  totalBookings: number
  cancelledBookings: number
  cancellationRate: number
  averageBookingValue: number
  totalGuests: number
}

export interface LegacyDailyRevenueResponse {
  date: string
  revenue: number
  bookingCount: number
}

export interface LegacyRoomPerformanceResponse {
  roomName: string
  bookingCount: number
  revenueGenerated: number
}

export interface LegacySourceBreakdownResponse {
  source: "RECEPTION" | "WEBSITE"
  count: number
  percentage: number
  totalRevenue: number
}

export interface LegacyBookingStatusStatsResponse {
  status: "BOOKED" | "ACTIVE" | "COMPLETED"
  count: number
  totalRevenue: number
}

export interface LegacyAdminAnalyticsDashboardResponse {
  summary: LegacySummaryStatsResponse
  statusBreakdown: LegacyBookingStatusStatsResponse[]
  revenueTrend: LegacyDailyRevenueResponse[]
  bookingSources: LegacySourceBreakdownResponse[]
  roomPerformance: LegacyRoomPerformanceResponse[]
}

// Core Summary Statistics
export interface SummaryStats {
  revenue: {
    total: number
    confirmed: number
    cancelled: number
    average: number
  }
  bookings: {
    total: number
    confirmed: number
    cancelled: number
    active: number
    completed: number
    cancellationRate: number
  }
  guests: {
    total: number
    averagePerBooking: number
  }
  occupancy: {
    rate: number
    totalBedNights: number
    occupiedBedNights: number
  }
}

// Time-based Trends
export interface RevenueTrendItem {
  date: string
  revenue: number
  bookings: number
  guests: number
  averageRate: number
}

// Booking Status Breakdown
export interface BookingStatusBreakdown {
  status: "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  count: number
  revenue: number
  percentage: number
}

// Booking Source Analysis
export interface BookingSourceStats {
  source: "RECEPTION" | "WEBSITE"
  bookings: number
  revenue: number
  percentage: number
  averageValue: number
  cancellationRate: number
}

// Room Performance Metrics
export interface RoomPerformance {
  roomId: number
  roomName: string
  categoryName: string
  bookings: number
  revenue: number
  occupancyRate: number
  averageRate: number
  totalNights: number
}

// Category Performance
export interface CategoryPerformance {
  categoryId: number
  categoryName: string
  bookings: number
  revenue: number
  rooms: number
  averageRate: number
  occupancyRate: number
}

// Peak Performance Analysis
export interface PeakAnalysis {
  busiestDays: Array<{
    date: string
    bookings: number
    revenue: number
  }>
  topRooms: Array<{
    roomId: number
    roomName: string
    revenue: number
  }>
  averageLeadTime: number
  averageStayDuration: number
}

// Main Analytics Response
export interface AdminAnalyticsDashboardResponse {
  period: {
    startDate: string
    endDate: string
    totalDays: number
  }
  summary: SummaryStats
  trends: {
    daily: RevenueTrendItem[]
    weekly?: RevenueTrendItem[]
    monthly?: RevenueTrendItem[]
  }
  breakdown: {
    byStatus: BookingStatusBreakdown[]
    bySources: BookingSourceStats[]
  }
  performance: {
    rooms: RoomPerformance[]
    categories: CategoryPerformance[]
  }
  insights: PeakAnalysis
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
  // Helper method to get auth headers
  private static getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("accessToken")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  // ============= AUTHENTICATION =============
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
    if (!response.ok) throw new Error("Failed to login")
    return response.json()
  }

  static async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to register")
    return response.json()
  }

  static async refreshToken(
    data: RefreshTokenRequest
  ): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to refresh token")
    return response.json()
  }

  // ============= BOOKINGS =============
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

  static async cancelBooking(id: number): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/bookings/cancel-booking/${id}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      }
    )
    if (!response.ok) throw new Error("Failed to cancel booking")
    return response.text()
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

  // ============= ROOMS =============
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

  static async createRoom(room: CreateRoomDto): Promise<RoomsDto> {
    const response = await fetch(`${API_BASE_URL}/rooms/add-room`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(room),
    })
    if (!response.ok) throw new Error("Failed to create room")
    return response.json()
  }

  static async updateRoom(id: number, room: CreateRoomDto): Promise<RoomsDto> {
    const response = await fetch(`${API_BASE_URL}/rooms/update-room/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(room),
    })
    if (!response.ok) throw new Error("Failed to update room")
    return response.json()
  }

  static async deleteRoom(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/rooms/delete-room/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete room")
  }

  // ============= BUNKS =============
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

  static async createBunk(bunk: BunkRequestDto): Promise<BunkResponseDto> {
    const response = await fetch(`${API_BASE_URL}/bunks/add-bunk`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(bunk),
    })
    if (!response.ok) throw new Error("Failed to create bunk")
    return response.json()
  }

  static async updateBunk(
    id: number,
    bunk: BunkRequestDto
  ): Promise<BunkResponseDto> {
    const response = await fetch(`${API_BASE_URL}/bunks/update-bunk/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(bunk),
    })
    if (!response.ok) throw new Error("Failed to update bunk")
    return response.json()
  }

  static async deleteBunk(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/bunks/delete-bunk/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete bunk")
  }

  // ============= CATEGORIES =============
  static async getAllCategories(): Promise<CategoryDto[]> {
    const response = await fetch(`${API_BASE_URL}/categories`)
    if (!response.ok) throw new Error("Failed to fetch categories")
    return response.json()
  }

  static async getCategory(id: number): Promise<CategoryDto> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`)
    if (!response.ok) throw new Error("Failed to fetch category")
    return response.json()
  }

  static async createCategory(
    category: CreateCategoryDto
  ): Promise<CategoryDto> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(category),
    })
    if (!response.ok) throw new Error("Failed to create category")
    return response.json()
  }

  static async updateCategory(
    id: number,
    category: CreateCategoryDto
  ): Promise<CategoryDto> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(category),
    })
    if (!response.ok) throw new Error("Failed to update category")
    return response.json()
  }

  static async deleteCategory(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete category")
  }

  // ============= AMENITIES =============
  static async getAllAmenities(): Promise<AmenityDto[]> {
    const response = await fetch(`${API_BASE_URL}/amenities`)
    if (!response.ok) throw new Error("Failed to fetch amenities")
    return response.json()
  }

  static async getAmenity(id: number): Promise<AmenityDto> {
    const response = await fetch(`${API_BASE_URL}/amenities/${id}`)
    if (!response.ok) throw new Error("Failed to fetch amenity")
    return response.json()
  }

  static async createAmenity(
    amenity: CreateAmenityDto
  ): Promise<AmenityDto> {
    const response = await fetch(`${API_BASE_URL}/amenities`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(amenity),
    })
    if (!response.ok) throw new Error("Failed to create amenity")
    return response.json()
  }

  static async updateAmenity(
    id: number,
    amenity: CreateAmenityDto
  ): Promise<AmenityDto> {
    const response = await fetch(`${API_BASE_URL}/amenities/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(amenity),
    })
    if (!response.ok) throw new Error("Failed to update amenity")
    return response.json()
  }

  static async deleteAmenity(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/amenities/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete amenity")
  }

  // ============= PICTURES =============
  static async getPicturesByRoom(roomId: number): Promise<PictureDto[]> {
    const response = await fetch(`${API_BASE_URL}/pictures/room/${roomId}`)
    if (!response.ok) throw new Error("Failed to fetch pictures")
    return response.json()
  }

  static async getPictureById(id: number): Promise<PictureDto> {
    const response = await fetch(`${API_BASE_URL}/pictures/${id}`)
    if (!response.ok) throw new Error("Failed to fetch picture")
    return response.json()
  }

  static async uploadPictures(
    roomId: number,
    images: File[]
  ): Promise<string> {
    const formData = new FormData()
    images.forEach((image) => formData.append("images", image))

    const token = localStorage.getItem("accessToken")
    const response = await fetch(
      `${API_BASE_URL}/pictures/upload/${roomId}`,
      {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      }
    )
    if (!response.ok) throw new Error("Failed to upload pictures")
    return response.text()
  }

  static async updatePicture(id: number, image: File): Promise<object> {
    const formData = new FormData()
    formData.append("image", image)

    const token = localStorage.getItem("accessToken")
    const response = await fetch(`${API_BASE_URL}/pictures/${id}`, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })
    if (!response.ok) throw new Error("Failed to update picture")
    return response.json()
  }

  static async deletePicture(id: number): Promise<object> {
    const response = await fetch(`${API_BASE_URL}/pictures/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete picture")
    return response.json()
  }

  // ============= REVIEWS =============
  static async getAllReviews(): Promise<Review[]> {
    const response = await fetch(`${API_BASE_URL}/reviews`)
    if (!response.ok) throw new Error("Failed to fetch reviews")
    return response.json()
  }

  static async submitReviewByToken(
    token: string,
    review: ReviewRequestDto
  ): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/reviews/by-token/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    })
    if (!response.ok) throw new Error("Failed to submit review")
    return response.text()
  }

  static async validateReviewToken(token: string): Promise<boolean> {
    const params = new URLSearchParams({ token })
    const response = await fetch(`${API_BASE_URL}/reviews/validate?${params}`)
    if (!response.ok) throw new Error("Failed to validate token")
    return response.json()
  }

  static async deleteReview(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete review")
  }

  // ============= CONTACT MESSAGES =============
  static async getAllContactMessages(): Promise<ContactMessage[]> {
    const response = await fetch(`${API_BASE_URL}/contact`)
    if (!response.ok) throw new Error("Failed to fetch contact messages")
    return response.json()
  }

  static async sendContactMessage(
    message: ContactMessageDto
  ): Promise<ContactMessage> {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    })
    if (!response.ok) throw new Error("Failed to send contact message")
    return response.json()
  }

  static async deleteContactMessage(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/contact/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to delete contact message")
  }

  // ============= ADMIN ANALYTICS =============
  static async getAnalytics(
    request: AnalyticsRequest
  ): Promise<AdminAnalyticsDashboardResponse> {
    const params = new URLSearchParams({
      startDate: request.startDate,
      endDate: request.endDate,
    })
    const response = await fetch(`${API_BASE_URL}/admin/?${params}`, {
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to fetch analytics")
    const legacyData: LegacyAdminAnalyticsDashboardResponse =
      await response.json()
    return this.transformLegacyAnalytics(legacyData, request)
  }

  // Transform legacy API response to new structure
  private static transformLegacyAnalytics(
    legacy: LegacyAdminAnalyticsDashboardResponse,
    request: AnalyticsRequest
  ): AdminAnalyticsDashboardResponse {
    const { summary, statusBreakdown, revenueTrend, bookingSources, roomPerformance } = legacy

    // Calculate total days
    const startDate = new Date(request.startDate)
    const endDate = new Date(request.endDate)
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    // Calculate confirmed bookings
    const confirmedBookings = summary.totalBookings - summary.cancelledBookings

    // Transform to new structure
    return {
      period: {
        startDate: request.startDate,
        endDate: request.endDate,
        totalDays,
      },
      summary: {
        revenue: {
          total: summary.totalRevenue + summary.potentialLostRevenue,
          confirmed: summary.totalRevenue,
          cancelled: summary.potentialLostRevenue,
          average: summary.averageBookingValue,
        },
        bookings: {
          total: summary.totalBookings,
          confirmed: confirmedBookings,
          cancelled: summary.cancelledBookings,
          active: statusBreakdown.find((s) => s.status === "ACTIVE")?.count || 0,
          completed: statusBreakdown.find((s) => s.status === "COMPLETED")?.count || 0,
          cancellationRate: summary.cancellationRate,
        },
        guests: {
          total: summary.totalGuests,
          averagePerBooking:
            summary.totalBookings > 0
              ? summary.totalGuests / summary.totalBookings
              : 0,
        },
        occupancy: {
          rate: 0, // Not available in legacy API
          totalBedNights: 0, // Not available in legacy API
          occupiedBedNights: 0, // Not available in legacy API
        },
      },
      trends: {
        daily: revenueTrend.map((item) => ({
          date: item.date,
          revenue: item.revenue,
          bookings: item.bookingCount,
          guests: 0, // Not available in legacy API
          averageRate:
            item.bookingCount > 0 ? item.revenue / item.bookingCount : 0,
        })),
      },
      breakdown: {
        byStatus: statusBreakdown.map((item) => ({
          status: item.status === "BOOKED" ? "CONFIRMED" : item.status,
          count: item.count,
          revenue: item.totalRevenue,
          percentage:
            summary.totalBookings > 0
              ? (item.count / summary.totalBookings) * 100
              : 0,
        })),
        bySources: bookingSources.map((source) => ({
          source: source.source,
          bookings: source.count,
          revenue: source.totalRevenue,
          percentage: source.percentage,
          averageValue:
            source.count > 0 ? source.totalRevenue / source.count : 0,
          cancellationRate: 0, // Not available in legacy API
        })),
      },
      performance: {
        rooms: roomPerformance.map((room, index) => ({
          roomId: index + 1, // Not available in legacy API
          roomName: room.roomName,
          categoryName: "", // Not available in legacy API
          bookings: room.bookingCount,
          revenue: room.revenueGenerated,
          occupancyRate: 0, // Not available in legacy API
          averageRate:
            room.bookingCount > 0
              ? room.revenueGenerated / room.bookingCount
              : 0,
          totalNights: 0, // Not available in legacy API
        })),
        categories: [], // Not available in legacy API
      },
      insights: {
        busiestDays: revenueTrend
          .filter((day) => day.bookingCount > 0)
          .sort((a, b) => b.bookingCount - a.bookingCount)
          .slice(0, 5)
          .map((day) => ({
            date: day.date,
            bookings: day.bookingCount,
            revenue: day.revenue,
          })),
        topRooms: roomPerformance
          .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
          .slice(0, 5)
          .map((room, index) => ({
            roomId: index + 1,
            roomName: room.roomName,
            revenue: room.revenueGenerated,
          })),
        averageLeadTime: 0, // Not available in legacy API
        averageStayDuration: 0, // Not available in legacy API
      },
    }
  }

  static async getAdminData(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/get-data`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    })
    if (!response.ok) throw new Error("Failed to get admin data")
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
