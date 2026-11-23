import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { statsApi, ranksApi, badgesApi, coursesApi, UserStats, UserRank, UserBadge, UserCourse } from '../services/api'
import BadgeUnlockModal from '../components/ui/BadgeUnlockModal'
import SweetToastContainer from '../components/ui/SweetToastContainer'
import { showXpToast, showToast } from '../utils/toast'

interface UserContextType {
  stats: UserStats | null
  rank: UserRank | null
  badges: UserBadge[]
  courses: UserCourse[]
  isLoading: boolean
  newlyUnlockedBadge: UserBadge | null
  dismissUnlockedBadge: () => void
  showBadgeModal: (badge: UserBadge) => void
  refreshStats: () => Promise<void>
  refreshRank: () => Promise<void>
  refreshBadges: () => Promise<void>
  refreshCourses: () => Promise<void>
  refreshAll: () => Promise<void>
  checkAndAwardBadges: () => Promise<UserBadge[]>
  addXp: (xp: number) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { user, token, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [rank, setRank] = useState<UserRank | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [courses, setCourses] = useState<UserCourse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [unlockedBadgeModal, setUnlockedBadgeModal] = useState<UserBadge | null>(null)

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

  const notifyAwardedBadges = useCallback(
    async (awardedBadges: UserBadge[]) => {
      if (!awardedBadges || awardedBadges.length === 0) return
      await refreshBadges()
      await refreshStats()
      setUnlockedBadgeModal(awardedBadges[0])
      awardedBadges.forEach((b) => {
        showToast(`Emblema Atribuído: ${b.badgeName}`, {
          type: 'success',
          subtitle: b.badgeDescription || 'Você atingiu os requisitos e recebeu este emblema automaticamente!',
        })
        window.dispatchEvent(
          new CustomEvent('nextstep:badge-notification', {
            detail: b,
          })
        )
      })
    },
    [refreshBadges, refreshStats]
  )

  const checkAndAwardBadges = useCallback(async () => {
    if (!user || !token || user.role === 'Admin') return []
    try {
      const res = await badgesApi.checkBadges(user.id, token)
      if (res && res.awarded && res.badges && res.badges.length > 0) {
        await notifyAwardedBadges(res.badges)
        return res.badges
      }
      return []
    } catch (error) {
      console.error('Error checking badges:', error)
      return []
    }
  }, [user, token, notifyAwardedBadges])

  // Escuta notificações de emblemas atribuídos em background pelo BadgeSchedulerWorker
  useEffect(() => {
    if (!isAuthenticated || !user || !token || user.role === 'Admin') return

    const pollWorkerNotifications = async () => {
      try {
        const res = await badgesApi.getUnreadNotifications(user.id, token)
        if (res && res.badges && res.badges.length > 0) {
          await notifyAwardedBadges(res.badges)
        }
      } catch {
        // ignore transient polling error
      }
    }

    pollWorkerNotifications()
    const timer = window.setInterval(pollWorkerNotifications, 25000)
    return () => window.clearInterval(timer)
  }, [isAuthenticated, user, token, notifyAwardedBadges])

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
    if (!user || !token || user.role === 'Admin') return
    if (xp > 0) {
      showXpToast(xp)
    }
    try {
      const updatedStats = await statsApi.addXp(user.id, xp, token)
      setStats(updatedStats)
      await refreshRank()
      await checkAndAwardBadges()
    } catch (error) {
      console.error('Error adding XP:', error)
    }
  }, [user, token, refreshRank, checkAndAwardBadges])

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshAll()
    } else {
      setStats(null)
      setRank(null)
      setBadges([])
      setCourses([])
      setUnlockedBadgeModal(null)
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
        newlyUnlockedBadge: unlockedBadgeModal,
        dismissUnlockedBadge: () => setUnlockedBadgeModal(null),
        showBadgeModal: (b: UserBadge) => setUnlockedBadgeModal(b),
        refreshStats,
        refreshRank,
        refreshBadges,
        refreshCourses,
        refreshAll,
        checkAndAwardBadges,
        addXp,
      }}
    >
      {children}
      <SweetToastContainer />
      {user?.role !== 'Admin' && (
        <BadgeUnlockModal
          badge={unlockedBadgeModal}
          onClose={() => setUnlockedBadgeModal(null)}
          onViewGallery={() => {
            setUnlockedBadgeModal(null)
            navigate('/profile?tab=badges')
          }}
        />
      )}
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
