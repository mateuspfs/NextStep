import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { processesApi, coursesApi, Course } from '../services/api'
import { getDashboardConfig, saveDashboardConfig, getItemVote } from '../utils/nexpStore'
import { showToast } from '../utils/toast'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import DescriptionRenderer from '../components/ui/DescriptionRenderer'
import TopicMediaPreview from '../components/ui/TopicMediaPreview'

interface ProcessDetail {
  id?: number | string
  title: string
  subtitle?: string
  description: string
  category?: string
  modified?: string
  author?: string
}

const defaultRecentProcesses: ProcessDetail[] = [
  { id: 1, title: 'Fluxo de Revisão Editorial', subtitle: 'Revisão de Conteúdos', modified: 'há 3 dias', category: 'Editorial', description: 'Fluxo completo para revisão ortográfica, técnica e aprovação de publicações internas.' },
  { id: 2, title: 'Pipeline de Recursos Visuais', subtitle: 'Processamento de Ativos', modified: 'há 1 semana', category: 'Design & Mídia', description: 'Fluxo automatizado de padronização, compressão e geração de formatos web para imagens.' },
  { id: 3, title: 'Pagamento de Colaboradores', subtitle: 'Financeiro e Contratos', modified: 'há 2 semanas', category: 'Financeiro', description: 'Procedimentos de conferência de entregas, notas fiscais e liquidação de pagamentos.' },
  { id: 4, title: 'Validação de Metadados e SEO', subtitle: 'Indexação e Busca', modified: 'ontem', category: 'Tecnologia', description: 'Conferência de tags de busca, relevância e padrões de acessibilidade nas páginas.' },
  { id: 5, title: 'Guia Global de Estilo', subtitle: 'Identidade e Padrões', modified: 'hoje', category: 'Editorial', description: 'Manual de aplicação de cores, tipografia e diretrizes de comunicação corporativa.' },
]

export default function Dashboard() {
  const { user, token } = useAuth()
  const { stats, rank, courses, isLoading } = useUser()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'Admin'

  const [selectedProcess, setSelectedProcess] = useState<ProcessDetail | null>(null)
  const [allProcesses, setAllProcesses] = useState<ProcessDetail[]>(defaultRecentProcesses)
  const [recentProcesses, setRecentProcesses] = useState<ProcessDetail[]>(defaultRecentProcesses)
  const [latestCourses, setLatestCourses] = useState<Course[]>([])

  // Admin customization state
  const [dashConfig, setDashConfig] = useState(() => getDashboardConfig())
  const [showSelectFeaturedModal, setShowSelectFeaturedModal] = useState(false)
  const [showSelectMainListModal, setShowSelectMainListModal] = useState(false)

  // Suggestion modal on open for Common user (tema mais votado)
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)

  useEffect(() => {
    let mounted = true
    processesApi.getAll(token || undefined).then((data) => {
      if (mounted && data && data.length > 0) {
        const mapped = data.map((p, idx) => ({
          id: p.id || idx + 1,
          title: p.title,
          subtitle: p.subtitle,
          description: p.description,
          category: p.category,
          author: p.author,
          modified: p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : 'recente',
        }))
        setAllProcesses(mapped)
        setRecentProcesses(mapped.slice(0, 5))
      }
    }).catch(() => {})

    coursesApi.getAll(token || undefined).then((cData) => {
      if (mounted && cData) {
        setLatestCourses(cData.slice(0, 5))
      }
    }).catch(() => {})

    if (!isAdmin && !sessionStorage.getItem('nextstep_suggested_review_shown')) {
      sessionStorage.setItem('nextstep_suggested_review_shown', '1')
      setShowSuggestionModal(true)
    }

    return () => { mounted = false }
  }, [token, isAdmin])

  const inProgressCourses = courses?.filter(uc => !uc.isCompleted).slice(0, 5) || []

  // Featured process: uses Admin's manual selection if set, otherwise defaults to the latest registered process
  const featuredProcess =
    (dashConfig.featuredProcessId &&
      allProcesses.find((p) => String(p.id) === String(dashConfig.featuredProcessId))) ||
    allProcesses[0] ||
    defaultRecentProcesses[0]

  // Main 5 processes: uses Admin's manual list if set, otherwise top 5
  const displayedMainProcesses =
    dashConfig.mainProcessIds && dashConfig.mainProcessIds.length > 0
      ? dashConfig.mainProcessIds
          .map((id) => allProcesses.find((p) => String(p.id) === String(id)))
          .filter((p): p is ProcessDetail => Boolean(p))
      : recentProcesses.slice(0, 5)

  // Most voted process/topic for suggestion modal
  const mostVotedProcess =
    [...allProcesses].sort(
      (a, b) => getItemVote(String(b.id)).likes - getItemVote(String(a.id)).likes
    )[0] || featuredProcess

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Dashboard</p>
        <h1 className="text-3xl font-bold text-slate-900">Olá, {user?.fullName?.split(' ')[0]}!</h1>
        <p className="text-slate-600 mt-1">Acompanhe as principais movimentações em sua área bem como processos e atividades.</p>
      </div>

      {/* Stats Overview (Apenas Usuário Comum — Admin é perfil de gestão) */}
      {!isAdmin && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalXp}</p>
                <p className="text-sm text-slate-500">XP Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.coursesCompleted}</p>
                <p className="text-sm text-slate-500">Cursos Concluídos</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.badgesEarned}</p>
                <p className="text-sm text-slate-500">Conquistas</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.currentStreak}</p>
                <p className="text-sm text-slate-500">Dias Consecutivos</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* New / Featured Process Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="info">{featuredProcess.category || 'Novo Processo'}</Badge>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {dashConfig.featuredProcessId ? '📌 Destaque Selecionado' : '🆕 Último Processo Cadastrado'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Atualizado • {featuredProcess.modified || 'recente'}</span>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={() => setShowSelectFeaturedModal(true)}>
                    ✏️ Alterar Destaque
                  </Button>
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{featuredProcess.title}</h2>
            <TopicMediaPreview content={featuredProcess.description} clampLines={3} className="mb-6" />
            <div className="flex items-center gap-2">
              <Button onClick={() => setSelectedProcess(featuredProcess)}>
                Ver detalhes
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('/processes', '_blank')}
              >
                Abrir em Nova Guia ↗
              </Button>
            </div>
          </Card>

          {/* Courses / Activities Section (5 items) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {isAdmin ? 'Últimas 5 Atividades Adicionadas' : 'Atividades em Andamento (Até 5)'}
              </h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/training')}>
                Ver tudo
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Button>
            </div>
            {isAdmin && latestCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestCourses.slice(0, 5).map((course) => (
                  <Card key={course.id} className="p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="info">{course.categoryName || 'Atividade'}</Badge>
                        <span className="text-xs font-bold text-blue-600">+{course.totalXp} XP</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mb-1 text-sm">{course.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                      {course.totalLessons} etapas • Somente leitura no Dashboard
                    </p>
                  </Card>
                ))}
              </div>
            ) : inProgressCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {inProgressCourses.map((userCourse) => (
                  <Card key={userCourse.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-500 uppercase">{userCourse.courseTitle.split(' ')[0]}</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-1">{userCourse.courseTitle}</h4>
                    <p className="text-sm text-slate-500 mb-3">
                      {userCourse.completedLessons} de {userCourse.totalLessons} lições
                    </p>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">Progresso</span>
                        <span className="font-medium text-slate-900">{userCourse.progressPercentage}%</span>
                      </div>
                      <ProgressBar value={userCourse.progressPercentage} />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-slate-500">Nenhum curso em andamento</p>
                <Button className="mt-4" onClick={() => navigate('/training')}>Explorar Cursos</Button>
              </Card>
            )}
          </div>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Main Processes (5 items) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Principais Processos (5)</h3>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowSelectMainListModal(true)}
                    className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded"
                  >
                    ✏️ Editar Lista
                  </button>
                )}
                <button
                  onClick={() => navigate('/processes')}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Ver Central
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {displayedMainProcesses.map((process, idx) => (
                <div
                  key={process.id}
                  onClick={() => setSelectedProcess(process)}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{process.title}</p>
                    <p className="text-xs text-slate-500">Modificado {process.modified}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          </Card>

          {/* User Rank (Apenas Usuário Comum) / Atalhos de Gestão (Admin) */}
          {!isAdmin && rank ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Seu Rank</h3>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-slate-900">{rank.rankName}</h4>
                <p className="text-sm text-slate-500">{rank.currentPoints} pontos</p>
                {stats && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600">Próximo nível</span>
                      <span className="font-medium text-slate-900">{stats.xpToNextLevel} XP</span>
                    </div>
                    <ProgressBar value={stats.totalXp} max={stats.currentLevel * 100} />
                  </div>
                )}
              </div>
            </Card>
          ) : isAdmin ? (
            <Card className="p-6 space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">⚙️ Atalhos de Gestão Admin</h3>
              <p className="text-xs text-slate-500">
                Acesse rapidamente os módulos administrativos de atendimento de solicitações e gestão da loja:
              </p>
              <div className="space-y-2 pt-1">
                <Button size="sm" className="w-full" onClick={() => navigate('/admin/approvals')}>
                  📬 Atender Solicitações (Processos & Loja)
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate('/admin/nexp')}>
                  🛍️ Gestão NexP & Pedidos da Loja
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate('/admin/users')}>
                  👥 Painel de Usuários & Insights IA
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Process Detail Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                {selectedProcess.category && (
                  <Badge variant="info" className="mb-2">{selectedProcess.category}</Badge>
                )}
                <h3 className="text-xl font-bold text-slate-900">{selectedProcess.title}</h3>
                {selectedProcess.subtitle && (
                  <p className="text-sm text-blue-600">{selectedProcess.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedProcess(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <DescriptionRenderer content={selectedProcess.description} />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>{selectedProcess.author || 'Processo Documentado Internamente'}</span>
              <span>{selectedProcess.modified ? `Atualizado ${selectedProcess.modified}` : 'Ativo'}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSelectedProcess(null)}>
                Fechar
              </Button>
              <Button
                onClick={() => {
                  setSelectedProcess(null)
                  navigate('/processes')
                }}
              >
                Ver na Central de Processos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal: Selecionar Processo Destacado */}
      {showSelectFeaturedModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Selecionar Processo em Destaque</h3>
              <button onClick={() => setShowSelectFeaturedModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Por padrão, o Dashboard exibe automaticamente o último processo cadastrado. Selecione abaixo caso deseje fixar um processo específico:
            </p>
            <div className="max-h-72 overflow-y-auto space-y-2">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...dashConfig, featuredProcessId: undefined }
                  setDashConfig(updated)
                  saveDashboardConfig(updated)
                  setShowSelectFeaturedModal(false)
                }}
                className={`w-full text-left p-3 rounded-lg border text-xs font-semibold ${
                  !dashConfig.featuredProcessId ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                🔄 Automático (Sempre puxar o último processo cadastrado)
              </button>
              {allProcesses.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    const updated = { ...dashConfig, featuredProcessId: String(p.id) }
                    setDashConfig(updated)
                    saveDashboardConfig(updated)
                    setShowSelectFeaturedModal(false)
                    showToast('Processo em destaque atualizado!', { type: 'success', subtitle: p.title })
                  }}
                  className={`w-full text-left p-3 rounded-lg border ${
                    String(dashConfig.featuredProcessId) === String(p.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.category} • {p.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Modal: Editar 5 Principais Processos */}
      {showSelectMainListModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Editar Lista de 5 Principais Processos</h3>
              <button onClick={() => setShowSelectMainListModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Marque até 5 processos para compor a lista lateral de Principais Processos:
            </p>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {allProcesses.map((p) => {
                const currentIds = dashConfig.mainProcessIds || recentProcesses.map((r) => String(r.id))
                const checked = currentIds.includes(String(p.id))
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        let next = [...currentIds]
                        if (checked) {
                          next = next.filter((id) => id !== String(p.id))
                        } else if (next.length < 5) {
                          next.push(String(p.id))
                        }
                        const updated = { ...dashConfig, mainProcessIds: next }
                        setDashConfig(updated)
                        saveDashboardConfig(updated)
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.category}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setShowSelectMainListModal(false)
                  showToast('Lista de principais processos salva!', { type: 'success' })
                }}
              >
                Concluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sugestão de Leitura ao abrir o site (Tema mais votado - Recurso de Aprendizagem) */}
      {showSuggestionModal && !isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                💡 Recurso de Aprendizagem • Mais Votado
              </span>
              <button
                onClick={() => setShowSuggestionModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sugestão de Revisão do Dia</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecionamos o tema mais votado pela comunidade para reforçar seu aprendizado ativo:
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="info">{mostVotedProcess.category || 'Processo'}</Badge>
                <span className="text-xs font-bold text-emerald-700">
                  👍 {getItemVote(String(mostVotedProcess.id)).likes} votos positivos
                </span>
              </div>
              <h4 className="font-bold text-slate-900">{mostVotedProcess.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-3">{mostVotedProcess.subtitle || mostVotedProcess.description}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowSuggestionModal(false)}>
                Revisar Depois
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowSuggestionModal(false)
                  setSelectedProcess(mostVotedProcess)
                }}
              >
                Ler Tema Agora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
