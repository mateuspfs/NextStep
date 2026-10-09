import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { statsApi, ranksApi, badgesApi, coursesApi, UserStats, UserRank, UserBadge, UserCourse } from '../services/api'

interface UserContextType {
  stats: UserStats | null
  rank: UserRank | null
  badges: UserBadge[]
  courses: UserCourse[]
  isLoading: boolean
  refreshStats: () => Promise<void>
  refreshRank: () => Promise<void>
  refreshBadges: () => Promise<void>
  refreshCourses: () => Promise<void>
  refreshAll: () => Promise<void>
  addXp: (xp: number) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, token, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [rank, setRank] = useState<UserRank | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [courses, setCourses] = useState<UserCourse[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refreshStats = useCallback(async () => {
    if (!user || !token) return
    try {
      const data = await statsApi.getUserStats(user.id, token)
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [user, token])

  const refreshRank = useCallback(async () => {
    if (!user || !token) return
    try {
      const data = await ranksApi.getUserRank(user.id, token)
      setRank(data)
    } catch (error) {
      console.error('Error fetching rank:', error)
    }
  }, [user, token])

  const refreshBadges = useCallback(async () => {
    if (!user || !token) return
    try {
      const data = await badgesApi.getUserBadges(user.id, token)
      setBadges(data)
    } catch (error) {
      console.error('Error fetching badges:', error)
    }
  }, [user, token])

  const refreshCourses = useCallback(async () => {
    if (!user || !token) return
    try {
      const data = await coursesApi.getUserCourses(user.id, token)
      setCourses(data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }, [user, token])

  const refreshAll = useCallback(async () => {
    if (!user || !token) return
    setIsLoading(true)
    await Promise.all([
      refreshStats(),
      refreshRank(),
      refreshBadges(),
      refreshCourses(),
    ])
    setIsLoading(false)
  }, [user, token, refreshStats, refreshRank, refreshBadges, refreshCourses])

  const addXp = useCallback(async (xp: number) => {
    if (!user || !token) return
    try {
      const updatedStats = await statsApi.addXp(user.id, xp, token)
      setStats(updatedStats)
      await refreshRank()
      await refreshBadges()
    } catch (error) {
      console.error('Error adding XP:', error)
    }
  }, [user, token, refreshRank, refreshBadges])

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshAll()
    } else {
      setStats(null)
      setRank(null)
      setBadges([])
      setCourses([])
    }
  }, [isAuthenticated, user, refreshAll])

  return (
    <UserContext.Provider
      value={{
        stats,
        rank,
        badges,
        courses,
        isLoading,
        refreshStats,
        refreshRank,
        refreshBadges,
        refreshCourses,
        refreshAll,
        addXp,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
