/// <reference types="vite/client" />

function resolveApiBaseUrl() {
  const fromEnv = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')
  if (fromEnv) {
    return fromEnv
  }
  return 'http://localhost:5001/api'
}

const API_BASE_URL = resolveApiBaseUrl()

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
    apiRequest<{ token: string; user: { id: string; fullName: string; email: string; role: string | number } }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
}

// Users (Admin only)
export interface User {
  id: string
  fullName: string
  email: string
  role: 'Common' | 'Admin'
  nexPoints: number
  photoUrl?: string
  createdAt: string
}

export const usersApi = {
  getAll: (token?: string) => apiRequest<User[]>('/users', { token }),
  getById: (id: string, token?: string) => apiRequest<User>(`/users/${id}`, { token }),
  create: (data: CreateUserData, token?: string) =>
    apiRequest<User>('/users', { method: 'POST', body: data, token }),
  delete: (id: string, token?: string) =>
    apiRequest(`/users/${id}`, { method: 'DELETE', token }),
}

export interface CreateUserData {
  fullName: string
  email: string
  password: string
  role: 'Common' | 'Admin'
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

// Categories
export const categoriesApi = {
  getAll: (token?: string) => apiRequest<Category[]>('/categories', { token }),
  getById: (id: string, token?: string) => apiRequest<Category>(`/categories/${id}`, { token }),
  create: (data: CreateCategoryData, token?: string) =>
    apiRequest<Category>('/categories', { method: 'POST', body: data, token }),
  update: (id: string, data: CreateCategoryData, token?: string) =>
    apiRequest(`/categories/${id}`, { method: 'PUT', body: data, token }),
  delete: (id: string, token?: string) =>
    apiRequest(`/categories/${id}`, { method: 'DELETE', token }),
}

export interface CreateCategoryData {
  name: string
  description?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
}

// Case Studies
export const caseStudiesApi = {
  getAll: (token?: string) => apiRequest<Content[]>('/casestudies', { token }),
  submit: (data: SubmitCaseStudyData, token?: string) =>
    apiRequest<Content>('/casestudies/submit', { method: 'POST', body: data, token }),
  getPending: (token?: string) => apiRequest<Content[]>('/casestudies/pending', { token }),
  getMySubmissions: (token?: string) => apiRequest<Content[]>('/casestudies/my-submissions', { token }),
  approve: (id: string, token?: string) =>
    apiRequest(`/casestudies/${id}/approve`, { method: 'POST', token }),
  reject: (id: string, token?: string) =>
    apiRequest(`/casestudies/${id}/reject`, { method: 'POST', token }),
}

// Forum & Known Errors
export interface ForumCommentDto {
  id: string
  author: string
  time: string
  content: string
  votes: number
  isSolution?: boolean
}

export interface ForumQuestionDto {
  id: string
  title: string
  description: string
  author: string
  time: string
  votes: number
  answers: number
  views: number
  tag: string
  hasBestAnswer?: boolean
  isKnownError?: boolean
  userVoted?: boolean
  comments: ForumCommentDto[]
}

export interface KnownErrorDto {
  id: string
  title: string
  description: string
  type: 'error' | 'warning'
  category: string
  severity: 'Crítico' | 'Moderado' | 'Aviso'
  solution: string
  stepsToFix?: string[]
  source: 'Sistema' | 'Fórum'
  relatedForumId?: string
}

export const forumApi = {
  getQuestions: (token?: string) => apiRequest<ForumQuestionDto[]>('/forum/questions', { token }),
  createQuestion: (
    data: { title: string; description: string; tag: string; author?: string; isKnownError: boolean },
    token?: string
  ) => apiRequest<ForumQuestionDto>('/forum/questions', { method: 'POST', body: data, token }),
  toggleVote: (questionId: string | number, token?: string) =>
    apiRequest<{ question: ForumQuestionDto; userVoted: boolean }>(`/forum/questions/${questionId}/vote`, {
      method: 'POST',
      token,
    }),
  incrementView: (questionId: string | number, token?: string) =>
    apiRequest<ForumQuestionDto>(`/forum/questions/${questionId}/view`, { method: 'POST', token }),
  addComment: (
    questionId: string | number,
    data: { content: string; author?: string; isSolution: boolean },
    token?: string
  ) => apiRequest<ForumQuestionDto>(`/forum/questions/${questionId}/comments`, { method: 'POST', body: data, token }),
  toggleCommentSolution: (questionId: string | number, commentId: string | number, token?: string) =>
    apiRequest<ForumQuestionDto>(`/forum/questions/${questionId}/comments/${commentId}/toggle-solution`, {
      method: 'POST',
      token,
    }),
  toggleKnownError: (questionId: string | number, token?: string) =>
    apiRequest<ForumQuestionDto>(`/forum/questions/${questionId}/toggle-known-error`, { method: 'POST', token }),
  getKnownErrors: (token?: string) => apiRequest<KnownErrorDto[]>('/forum/known-errors', { token }),
  createKnownError: (
    data: {
      title: string
      description: string
      type: 'error' | 'warning'
      category: string
      solution: string
      stepsToFix?: string[]
      source?: string
    },
    token?: string
  ) => apiRequest<KnownErrorDto>('/forum/known-errors', { method: 'POST', body: data, token }),
}

export interface SubmitCaseStudyData {
  title: string
  subtitle: string
  content: string
  categoryId: string
  imageUrl?: string
}

export interface Content {
  id: string
  title: string
  subtitle: string
  description: string
  type: number
  categoryId: string
  categoryName: string
  authorId: string
  authorName: string
  imageUrl?: string
  status: number
  createdAt: string
  updatedAt: string
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
