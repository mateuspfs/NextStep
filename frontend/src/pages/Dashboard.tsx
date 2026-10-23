import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { processesApi } from '../services/api'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'

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
  const [selectedProcess, setSelectedProcess] = useState<ProcessDetail | null>(null)
  const [recentProcesses, setRecentProcesses] = useState<ProcessDetail[]>(defaultRecentProcesses)

  useEffect(() => {
    let mounted = true
    processesApi.getAll(token || undefined).then((data) => {
      if (mounted && data && data.length > 0) {
        setRecentProcesses(
          data.slice(0, 5).map((p, idx) => ({
            id: idx + 1,
            title: p.title,
            subtitle: p.subtitle,
            description: p.description,
            category: p.category,
            author: p.author,
            modified: p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : 'recente',
          }))
        )
      }
    }).catch(() => {})
    return () => { mounted = false }
  }, [token])

  const inProgressCourses = courses?.filter(uc => !uc.isCompleted).slice(0, 3) || []

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

      {/* Stats Overview */}
      {stats && (
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
          {/* New Process Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Badge variant="info">Novo Processo</Badge>
              <span className="text-sm text-slate-500">Adicionado • há 2 horas</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Troca de senha dos clientes Master</h2>
            <p className="text-slate-600 mb-6">
              Após solicitações internas, foi desenvolvido um novo mecanismo de redefinição de senha em conformidade com as diretrizes da LGPD. Acesse para conferir os passos do fluxo e orientações.
            </p>
            <Button
              onClick={() =>
                setSelectedProcess({
                  title: 'Troca de senha dos clientes Master',
                  subtitle: 'Segurança da Informação e LGPD',
                  description:
                    'Este procedimento detalha a redefinição de credenciais de contas master de clientes corporativos. Todas as ações exigem duplo fator de autenticação (2FA) e envio de link temporário com expiração em 15 minutos, mantendo trilha de auditoria criptografada.',
                  category: 'Segurança',
                  modified: 'há 2 horas',
                  author: 'Equipe de Segurança & Compliance',
                })
              }
            >
              Ver detalhes
            </Button>
          </Card>

          {/* Courses in Progress */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Cursos em Andamento</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/training')}>
                Ver tudo
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Button>
            </div>
            {inProgressCourses.length > 0 ? (
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
          {/* Main Processes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Principais Processos</h3>
              <button
                onClick={() => navigate('/processes')}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Ver Central
              </button>
            </div>
            <div className="space-y-4">
              {recentProcesses.map((process) => (
                <div
                  key={process.id}
                  onClick={() => setSelectedProcess(process)}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {process.id}
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

          {/* User Rank */}
          {rank && (
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
          )}
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

            <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed">
              {selectedProcess.description}
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
    </div>
  )
}
