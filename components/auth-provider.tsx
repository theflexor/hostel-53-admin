"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { HostelAPI } from "@/lib/api"

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  userEmail: string | null
  userRole: "USER" | "ADMIN" | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<"USER" | "ADMIN" | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Auto refresh token periodically
  useEffect(() => {
    const refreshTokenPeriodically = async () => {
      const refreshToken = localStorage.getItem("refreshToken")
      if (refreshToken && isAuthenticated) {
        try {
          const response = await HostelAPI.refreshToken({ token: refreshToken })
          localStorage.setItem("accessToken", response.accessToken)
          localStorage.setItem("refreshToken", response.refreshToken)
        } catch (error) {
          console.error("Failed to refresh token:", error)
          logout()
        }
      }
    }

    // Refresh token every 10 minutes
    const interval = setInterval(refreshTokenPeriodically, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    // Check authentication status
    const accessToken = localStorage.getItem("accessToken")
    const refreshToken = localStorage.getItem("refreshToken")
    const storedEmail = localStorage.getItem("userEmail")
    const storedRole = localStorage.getItem("userRole") as "USER" | "ADMIN" | null

    if (accessToken && refreshToken && storedEmail) {
      setIsAuthenticated(true)
      setUserEmail(storedEmail)
      setUsername(storedEmail.split("@")[0]) // Extract username from email
      setUserRole(storedRole)
    } else {
      setIsAuthenticated(false)
      setUsername(null)
      setUserEmail(null)
      setUserRole(null)
      if (pathname !== "/login") {
        router.push("/login")
      }
    }

    setLoading(false)
  }, [pathname, router])

  const login = async (email: string, password: string) => {
    try {
      const response = await HostelAPI.login({ email, password })

      // Store tokens
      localStorage.setItem("accessToken", response.accessToken)
      localStorage.setItem("refreshToken", response.refreshToken)
      localStorage.setItem("userEmail", email)

      // Note: The login endpoint doesn't return role, so we'll assume ADMIN for now
      // You might need to fetch user details separately if role is needed
      const role = "ADMIN" // Default for admin panel
      localStorage.setItem("userRole", role)

      setIsAuthenticated(true)
      setUserEmail(email)
      setUsername(email.split("@")[0])
      setUserRole(role)

      router.push("/")
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userRole")
    setIsAuthenticated(false)
    setUsername(null)
    setUserEmail(null)
    setUserRole(null)
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (!isAuthenticated && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Перенаправление на страницу входа...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, username, userEmail, userRole, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
