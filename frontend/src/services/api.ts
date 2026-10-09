/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

interface RequestOptions {
  method?: string
  body?: unknown
  token?: string
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    method,
    headers,
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: { id: string; fullName: string; email: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  register: (data: { fullName: string; email: string; password: string; confirmPassword: string }) =>
    apiRequest('/auth/register', { method: 'POST', body: data }),
}

// Courses
export const coursesApi = {
  getAll: (token?: string) => apiRequest<Course[]>('/courses', { token }),
  getById: (id: string, token?: string) => apiRequest<Course>(`/courses/${id}`, { token }),
  getUserCourses: (userId: string, token?: string) => apiRequest<UserCourse[]>(`/courses/user/${userId}`, { token }),
  enroll: (courseId: string, token?: string) =>
    apiRequest(`/courses/${courseId}/enroll`, { method: 'POST', token }),
}

// Badges
export const badgesApi = {
  getAll: (token?: string) => apiRequest<Badge[]>('/badges', { token }),
  getUserBadges: (userId: string, token?: string) => apiRequest<UserBadge[]>(`/badges/user/${userId}`, { token }),
}

// Ranks
export const ranksApi = {
  getAll: (token?: string) => apiRequest<Rank[]>('/ranks', { token }),
  getUserRank: (userId: string, token?: string) => apiRequest<UserRank>(`/ranks/user/${userId}`, { token }),
  getLeaderboard: (token?: string) => apiRequest<LeaderboardEntry[]>('/ranks/leaderboard', { token }),
}

// Stats
export const statsApi = {
  getUserStats: (userId: string, token?: string) => apiRequest<UserStats>(`/stats/user/${userId}`, { token }),
  addXp: (userId: string, xp: number, token?: string) =>
    apiRequest<UserStats>(`/stats/user/${userId}/add-xp`, { method: 'POST', body: { xp }, token }),
}

// Types
export interface Course {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  totalLessons: number
  totalXp: number
  level: number
  categoryId: string
  categoryName: string
  authorId: string
  authorName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserCourse {
  id: string
  userId: string
  courseId: string
  courseTitle: string
  courseThumbnail?: string
  completedLessons: number
  totalLessons: number
  progressPercentage: number
  isCompleted: boolean
  xpEarned: number
  completedAt?: string
  startedAt: string
  updatedAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  iconUrl: string
  rarity: number
  requiredPoints: number
  criteria?: string
  isActive: boolean
  createdAt: string
}

export interface UserBadge {
  id: string
  userId: string
  badgeId: string
  badgeName: string
  badgeDescription: string
  badgeIconUrl: string
  badgeRarity: string
  earnedAt: string
  isDisplayed: boolean
}

export interface Rank {
  id: string
  name: string
  description: string
  minPoints: number
  maxPoints: number
  iconUrl: string
  color: string
  position: number
}

export interface UserRank {
  id: string
  userId: string
  rankId: string
  rankName: string
  rankDescription: string
  rankIconUrl: string
  rankColor: string
  currentPoints: string
  achievedAt: string
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  userPhotoUrl?: string
  totalXp: number
  currentLevel: number
  position: number
  rankName: string
  rankIconUrl: string
}

export interface UserStats {
  id: string
  userId: string
  totalXp: number
  currentLevel: number
  xpToNextLevel: number
  coursesCompleted: number
  activitiesCompleted: number
  badgesEarned: number
  currentStreak: number
  longestStreak: number
  lastActivityDate?: string
}
