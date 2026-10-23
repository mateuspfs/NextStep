import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { processesApi, coursesApi, forumApi } from '../services/api'

interface SearchItem {
  id: string
  title: string
  subtitle: string
  type: 'Processo' | 'Treinamento' | 'Fórum' | 'Erro Conhecido' | 'Página'
  path: string
}

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  path: string
}

const defaultNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Novo Processo Homologado',
    description: 'Troca de senha dos clientes Master foi publicado na Central de Processos.',
    time: 'há 2 horas',
    read: false,
    path: '/processes',
  },
  {
    id: 'n2',
    title: 'Solução Validada no Fórum',
    description: 'Rafael Oliveira marcou uma solução oficial sobre latência de webhooks.',
    time: 'há 4 horas',
    read: false,
    path: '/knowledge',
  },
  {
    id: 'n3',
    title: 'Desafio de IA Disponível',
    description: 'Realize um quiz rápido de Compliance e ganhe +35 XP no Ranking Geral.',
    time: 'hoje',
    read: true,
    path: '/training',
  },
]

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchItems, setSearchItems] = useState<SearchItem[]>([])

  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications)
  const [showNotifications, setShowNotifications] = useState(false)

  const { user, token, logout } = useAuth()
  const { stats } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const isAdmin = user?.role === 'Admin'
  const isAdminPanel = location.pathname.startsWith('/admin')
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const baseItems: SearchItem[] = [
      { id: 'p-dash', title: 'Início / Dashboard', subtitle: 'Visão geral e indicadores', type: 'Página', path: '/' },
      { id: 'p-proc', title: 'Central de Processos', subtitle: 'Fluxos operacionais e checklists', type: 'Página', path: '/processes' },
      { id: 'p-know', title: 'Base de Conhecimento & Fórum', subtitle: 'Estudos de caso, dúvidas e erros conhecidos', type: 'Página', path: '/knowledge' },
      { id: 'p-train', title: 'Atividades e Treinamentos', subtitle: 'Cursos, quizzes com IA e ranking', type: 'Página', path: '/training' },
      { id: 'p-prof', title: 'Meu Perfil e Conquistas', subtitle: 'Evolução de carreira, XP e emblemas', type: 'Página', path: '/profile' },
    ]
    setSearchItems(baseItems)

    Promise.allSettled([
      processesApi.getAll(token || undefined),
      coursesApi.getAll(token || undefined),
      forumApi.getQuestions(token || undefined),
      forumApi.getKnownErrors(token || undefined),
    ]).then(([procRes, courseRes, forumRes, errRes]) => {
      const dynamic: SearchItem[] = [...baseItems]
      if (procRes.status === 'fulfilled' && procRes.value) {
        procRes.value.forEach((p) =>
          dynamic.push({
            id: `proc-${p.id}`,
            title: p.title,
            subtitle: `${p.category} • ${p.subtitle}`,
            type: 'Processo',
            path: '/processes',
          })
        )
      }
      if (courseRes.status === 'fulfilled' && courseRes.value) {
        courseRes.value.forEach((c) =>
          dynamic.push({
            id: `course-${c.id}`,
            title: c.title,
            subtitle: `${c.totalLessons} lições • +${c.totalXp} XP`,
            type: 'Treinamento',
            path: '/training',
          })
        )
      }
      if (forumRes.status === 'fulfilled' && forumRes.value) {
        forumRes.value.forEach((q) =>
          dynamic.push({
            id: `forum-${q.id}`,
            title: q.title,
            subtitle: `Fórum • ${q.tag}`,
            type: 'Fórum',
            path: '/knowledge',
          })
        )
      }
      if (errRes.status === 'fulfilled' && errRes.value) {
        errRes.value.forEach((e) =>
          dynamic.push({
            id: `err-${e.id}`,
            title: e.title,
            subtitle: `Erro Conhecido • ${e.category}`,
            type: 'Erro Conhecido',
            path: '/knowledge',
          })
        )
      }
      setSearchItems(dynamic)
    })
  }, [token])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredResults = searchQuery.trim()
    ? searchItems
        .filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.type.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 7)
    : []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 relative z-30">
      {/* Global Search */}
      <div className="flex-1 max-w-md" ref={searchRef}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Busque processos, cursos, erros conhecidos ou dúvidas..."
            value={searchQuery}
            onFocus={() => setShowSearchDropdown(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSearchDropdown(true)
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-11 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              {filteredResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path)
                        setShowSearchDropdown(false)
                        setSearchQuery('')
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50/60 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-600 shrink-0">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  Nenhum resultado encontrado para "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* XP Display */}
        {stats && (
          <button
            onClick={() => navigate('/profile')}
            title="Ver Meu Perfil e Carreira"
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-semibold text-blue-600">{stats.totalXp} XP</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
            title="Notificações"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <span className="text-sm font-bold text-slate-900">Notificações</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Marcar lidas
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                      )
                      setShowNotifications(false)
                      navigate(n.path)
                    }}
                    className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                      !n.read ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        !n.read ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">{n.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar -> Goes to Profile */}
        <button
          onClick={() => navigate('/profile')}
          title="Meu Perfil e Conquistas"
          className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-200 transition-all"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
        </button>

        {/* Admin Panel Button / Back to Main Panel */}
        {isAdmin && (
          <Link
            to={isAdminPanel ? '/' : '/admin'}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isAdminPanel ? 'Voltar ao Painel' : 'Painel Admin'}
          </Link>
        )}

        {/* Settings -> Goes to Profile Preferences */}
        <button
          onClick={() => navigate('/profile')}
          title="Preferências e Perfil"
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
          title="Sair"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
