import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Layers,
  BookOpen,
  GraduationCap,
  FileCheck,
  Users,
  CheckCircle2,
  Tag,
  User,
  Gift,
  Award,
  TrendingUp,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const commonUserNavItems = [
  { path: '/', label: 'Início', icon: 'grid' },
  { path: '/processes', label: 'Processos', icon: 'layers' },
  { path: '/knowledge', label: 'Base de Conhecimento', icon: 'book' },
  { path: '/training', label: 'Atividades', icon: 'cap' },
  { path: '/nexp', label: 'NexP & Benefícios', icon: 'gift' },
  { path: '/badges', label: 'Emblemas', icon: 'award' },
  { path: '/profile', label: 'Meu Perfil', icon: 'user' },
]

const adminMainNavItems = [
  { path: '/', label: 'Início (Gestão)', icon: 'grid' },
  { path: '/processes', label: 'Processos', icon: 'layers' },
  { path: '/knowledge', label: 'Base de Conhecimento', icon: 'book' },
  { path: '/training', label: 'Gestão de Quizzes', icon: 'cap' },
  { path: '/admin', label: 'Portal Admin', icon: 'users' },
  { path: '/profile', label: 'Conta Admin', icon: 'user' },
]

const adminNavItems = [
  { path: '/admin', label: 'Visão Geral', icon: 'grid' },
  { path: '/admin/users', label: 'Painel de Usuários', icon: 'users' },
  { path: '/admin/approvals', label: 'Solicitações', icon: 'check' },
  { path: '/admin/courses', label: 'Gestão de Atividades', icon: 'cap' },
  { path: '/admin/nexp', label: 'Gestão NexP & Loja', icon: 'gift' },
  { path: '/admin/badges', label: 'Gestão de Emblemas', icon: 'award' },
  { path: '/admin/categories', label: 'Categorias', icon: 'tag' },
]

function Icon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    grid: <LayoutGrid className="w-5 h-5" />,
    layers: <Layers className="w-5 h-5" />,
    book: <BookOpen className="w-5 h-5" />,
    cap: <GraduationCap className="w-5 h-5" />,
    document: <FileCheck className="w-5 h-5" />,
    users: <Users className="w-5 h-5" />,
    check: <CheckCircle2 className="w-5 h-5" />,
    tag: <Tag className="w-5 h-5" />,
    user: <User className="w-5 h-5" />,
    gift: <Gift className="w-5 h-5" />,
    award: <Award className="w-5 h-5" />,
  }
  return icons[name] || null
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const isAdminPanel = location.pathname.startsWith('/admin')

  const navItems = isAdminPanel ? adminNavItems : isAdmin ? adminMainNavItems : commonUserNavItems

  return (
    <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          {isOpen && <span className="font-bold text-xl text-slate-800">NextStep</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item, index) => (
          <NavLink
            key={`${item.path}-${item.label}-${index}`}
            to={item.path}
            end={item.path === '/' || item.path === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon name={item.icon} />
            {isOpen && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* Divider + Back button when in admin panel */}
        {isAdminPanel && (
          <>
            <div className="pt-4 pb-2">
              <div className="border-t border-slate-200" />
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {isOpen && <span>Voltar ao Início</span>}
            </button>
          </>
        )}
      </nav>

      {/* Collapse button */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          {isOpen && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  )
}
