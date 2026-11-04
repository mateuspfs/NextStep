import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../services/api'

interface User {
  id: string
  fullName: string
  email: string
  role: string
  nexPoints: number
  photoUrl?: string
  mustChangePassword?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  updateCurrentUser: (partial: Partial<User>) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'nextstep_token'
const USER_KEY = 'nextstep_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    // Backend may return role as: int (1=Admin, 0=Common), string "Admin"/"Common", or number as string "1"/"0"
    const roleValue = String(response.user.role)
    const isAdmin = roleValue === '1' || roleValue === 'Admin' || roleValue === 'admin'
    const roleString = isAdmin ? 'Admin' : 'Common'
    const userData: User = {
      id: response.user.id,
      fullName: response.user.fullName,
      email: response.user.email,
      role: roleString,
      nexPoints: response.user.nexPoints ?? 0,
      photoUrl: response.user.photoUrl,
      mustChangePassword: response.user.mustChangePassword ?? false,
    }

    localStorage.setItem(TOKEN_KEY, response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))

    setToken(response.token)
    setUser(userData)
  }

  const updateCurrentUser = (partial: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...partial }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        updateCurrentUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
