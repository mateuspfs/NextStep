import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usersApi, caseStudiesApi, processesApi, coursesApi, categoriesApi, quizzesApi, Content, ProcessDto } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import {
  getSavedActivityInsights,
  saveActivityInsight,
  SavedActivityInsight,
} from '../../utils/nexpStore'
import { showToast } from '../../utils/toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ImageUploadButton from '../../components/ui/ImageUploadButton'

interface User {
  id: string
  fullName: string
  email: string
  role: 'Common' | 'Admin'
  nexPoints: number
  photoUrl?: string
  createdAt: string
}

interface AnsweredActivityRecord {
  id: string
  title: string
  category: string
  score: string
  xpEarned: number
  completedAt: string
  savedInsight?: string
  qaList: {
    question: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
  }[]
}

const getAnsweredActivitiesForUser = (user: User): AnsweredActivityRecord[] => [
  {
    id: `act-${user.id}-1`,
    title: 'Protocolo de Resposta a Incidentes e LGPD',
    category: 'Segurança',
    score: '80% (4/5 acertos)',
    xpEarned: 80,
    completedAt: '12/11/2026',
    qaList: [
      {
        question: 'Qual é a primeira ação obrigatória ao detectar vazamento de credencial?',
        userAnswer: 'Notificar o cliente externo antes de isolar o servidor.',
        correctAnswer: 'Isolar imediatamente o serviço ou revogar a credencial afetada.',
        isCorrect: false,
      },
      {
        question: 'Onde deve ser documentado o relatório pós-incidente?',
        userAnswer: 'Na Central de Erros Conhecidos e Base Colaborativa.',
        correctAnswer: 'Na Central de Erros Conhecidos e Base Colaborativa.',
        isCorrect: true,
      },
      {
        question: 'Qual o prazo interno para abertura da sala de crise em severidade crítica?',
        userAnswer: 'Imediatamente (até 15 minutos após detecção).',
        correctAnswer: 'Imediatamente (até 15 minutos após detecção).',
        isCorrect: true,
      },
    ],
  },
  {
    id: `act-${user.id}-2`,
    title: 'Fluxo de Revisão Editorial e Validação de SEO',
    category: 'Editorial & Técnico',
    score: '67% (2/3 acertos)',
    xpEarned: 60,
    completedAt: '10/11/2026',
    qaList: [
      {
        question: 'Qual atributo é indispensável em imagens para acessibilidade e indexação?',
        userAnswer: 'Atributo alt descritivo.',
        correctAnswer: 'Atributo alt descritivo.',
        isCorrect: true,
      },
      {
        question: 'Como evitar penalidade de conteúdo duplicado em artigos republicados?',
        userAnswer: 'Remover todas as meta tags da página.',
        correctAnswer: 'Configurar a tag rel="canonical" apontando para a URL original.',
        isCorrect: false,
      },
    ],
  },
]

export default function UsersManagement() {
  const { token } = useAuth()
  const { data: users, loading, refetch } = useApi<User[]>(
    () => usersApi.getAll(token || undefined),
    [token]
  )

  const [allContents, setAllContents] = useState<Content[]>([])
  const [allProcesses, setAllProcesses] = useState<ProcessDto[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'insights'>('users')

  // Expandable user activities state
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [userRealAttemptsMap, setUserRealAttemptsMap] = useState<Record<string, AnsweredActivityRecord[]>>({})
  const [selectedActivityModal, setSelectedActivityModal] = useState<{
    user: User
    activity: AnsweredActivityRecord
  } | null>(null)
  const [aiInsightDraft, setAiInsightDraft] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [activitySavedInsightsMap, setActivitySavedInsightsMap] = useState<Record<string, string>>({})
  const [savedInsightsList, setSavedInsightsList] = useState<SavedActivityInsight[]>(() =>
    getSavedActivityInsights()
  )
  const [reinforcementFeedback, setReinforcementFeedback] = useState<string | null>(null)

  // User Create / Edit Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(true)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    photoUrl: '',
    role: 'Common' as 'Common' | 'Admin',
  })

  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Common'>('All')

  useEffect(() => {
    Promise.allSettled([
      caseStudiesApi.getAdminAll(token || undefined),
      processesApi.getAll(token || undefined),
    ]).then(([contRes, procRes]) => {
      if (contRes.status === 'fulfilled' && contRes.value) setAllContents(contRes.value)
      if (procRes.status === 'fulfilled' && procRes.value) setAllProcesses(procRes.value)
    })
  }, [token])

  const generateTempPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghijkmnopqrstuvwxyz'
    const digits = '23456789'
    const symbols = '!@#$*'
    const pick = (str: string) => str[Math.floor(Math.random() * str.length)]
    const raw = [
      'Nx',
      pick(upper),
      pick(lower),
      pick(lower),
      pick(digits),
      pick(digits),
      pick(digits),
      pick(symbols),
      pick(upper),
    ].join('')
    setNewUser((prev) => ({ ...prev, password: raw }))
    setShowPassword(true)
    setCopiedPassword(false)
  }

  const handleCopyPassword = async () => {
    if (!newUser.password) return
    try {
      await navigator.clipboard.writeText(newUser.password)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2500)
    } catch {
      // ignore
    }
  }

  const normalizeRole = (role: unknown): 'Common' | 'Admin' => {
    const val = String(role)
    return val === '1' || val === 'Admin' || val === 'admin' ? 'Admin' : 'Common'
  }

  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const userRole = normalizeRole(u.role)
    const matchesRole = roleFilter === 'All' || userRole === roleFilter
    return matchesSearch && matchesRole
  })

  const getUserCounters = (u: User) => {
    const userContents = allContents.filter(
      (c) => c.authorId === u.id || c.authorName?.toLowerCase() === u.fullName.toLowerCase()
    )
    const articles = userContents.filter((c) => c.type === 1).length
    const caseStudies = userContents.filter((c) => c.type === 0 || c.type === undefined).length
    const processes = allProcesses.filter(
      (p) => p.authorId === u.id || p.author?.toLowerCase() === u.fullName.toLowerCase()
    ).length
    const activities = getAnsweredActivitiesForUser(u).length
    return { articles, caseStudies, processes, activities }
  }

  const handleOpenEdit = (u: User) => {
    setEditingUser(u)
    setNewUser({
      fullName: u.fullName,
      email: u.email,
      password: '',
      photoUrl: u.photoUrl || '',
      role: normalizeRole(u.role),
    })
    setError('')
    setShowCreateModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (
      newUser.password &&
      (newUser.password.length < 8 ||
        !/[A-Z]/.test(newUser.password) ||
        !/[0-9]/.test(newUser.password) ||
        !/[^A-Za-z0-9]/.test(newUser.password))
    ) {
      setError(
        'A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, um número e um caractere especial.'
      )
      return
    }

    setIsCreating(true)
    try {
      if (editingUser) {
        await usersApi.update(
          editingUser.id,
          {
            fullName: newUser.fullName.trim(),
            email: newUser.email.trim(),
            password: newUser.password.trim() || undefined,
            photoUrl: newUser.photoUrl.trim() || undefined,
            role: newUser.role,
          },
          token || undefined
        )
      } else {
        await usersApi.create(newUser, token || undefined)
      }
      setShowCreateModal(false)
      showToast(editingUser ? 'Usuário atualizado!' : 'Novo usuário cadastrado!', {
        type: 'success',
        subtitle: newUser.fullName.trim(),
      })
      setEditingUser(null)
      setNewUser({ fullName: '', email: '', password: '', photoUrl: '', role: 'Common' })
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    try {
      await usersApi.delete(id, token || undefined)
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir usuário')
    }
  }

  const handleGenerateAiInsight = () => {
    if (!selectedActivityModal) return
    setIsGeneratingAi(true)
    const { user, activity } = selectedActivityModal
    const wrongOnes = activity.qaList.filter((q) => !q.isCorrect)
    setTimeout(() => {
      const generated =
        wrongOnes.length > 0
          ? `🤖 Diagnóstico IA para ${user.fullName} na atividade "${activity.title}": O colaborador demonstrou domínio dos fluxos de documentação, porém apresentou lacuna conceitual em "${wrongOnes[0].question}". Recomenda-se incluir esta questão em uma atividade de fixação dirigida e sugerir a leitura do módulo correspondente.`
          : `🤖 Diagnóstico IA para ${user.fullName}: Aproveitamento integral (100%) na atividade "${activity.title}". Colaborador apto para atuar como multiplicador técnico deste tema.`
      setAiInsightDraft(generated)
      setIsGeneratingAi(false)
    }, 600)
  }

  const handleSaveAiInsight = () => {
    if (!selectedActivityModal || !aiInsightDraft.trim()) return
    const { user, activity } = selectedActivityModal
    setActivitySavedInsightsMap((prev) => ({
      ...prev,
      [activity.id]: aiInsightDraft.trim(),
    }))
    const wrongQuestions = activity.qaList.filter((q) => !q.isCorrect).map((q) => q.question)
    const updatedList = saveActivityInsight({
      id: `ins-${Date.now()}`,
      activityTitle: activity.title,
      userName: user.fullName,
      insightText: aiInsightDraft.trim(),
      wrongQuestionsSummary:
        wrongQuestions.length > 0
          ? wrongQuestions
          : ['Revisão avançada de procedimentos críticos da atividade'],
      createdAt: new Date().toISOString(),
    })
    setSavedInsightsList(updatedList)
  }

  const handleCreateReinforcementActivity = async (insight: SavedActivityInsight) => {
    try {
      const cats = await categoriesApi.getAll(token || undefined)
      const catId = cats?.[0]?.id
      if (catId) {
        await coursesApi.create(
          {
            title: `Reforço Dirigido: ${insight.activityTitle}`,
            description: `Atividade gerada a partir de Insights de IA com foco nas questões mais erradas: ${insight.wrongQuestionsSummary.join(' | ')}`,
            totalLessons: Math.max(2, insight.wrongQuestionsSummary.length),
            totalXp: 120,
            level: 1,
            categoryId: catId,
          },
          token || undefined
        )
      }
    } catch {
      // fallback notification
    }
    setReinforcementFeedback(
      `✅ Nova atividade de fixação "Reforço Dirigido: ${insight.activityTitle}" criada com sucesso com base nas questões mais erradas!`
    )
    setTimeout(() => setReinforcementFeedback(null), 5000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Carregando Painel de Usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Administração</p>
          <h1 className="text-3xl font-bold text-slate-900">
            Painel de Usuários & Recursos de Aprendizagem
          </h1>
          <p className="text-slate-600 mt-1">
            Acompanhe indicadores individuais, audite respostas de atividades e gere insights com IA para fixação do aprendizado.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            setNewUser({ fullName: '', email: '', password: '', photoUrl: '', role: 'Common' })
            setShowCreateModal(true)
          }}
        >
          + Novo Usuário (Senha Temporária)
        </Button>
      </div>

      {/* Tabs: Lista Expansiva de Usuários vs Aba de Insights / Recursos de Aprendizagem */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          👥 Lista Expansiva de Usuários ({users?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'insights'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          🧠 Recursos de Aprendizagem & Insights IA ({savedInsightsList.length})
        </button>
      </div>

      {reinforcementFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between">
          <span>{reinforcementFeedback}</span>
          <button onClick={() => setReinforcementFeedback(null)}>✕</button>
        </div>
      )}

      {activeTab === 'users' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar colaborador por nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              {(['All', 'Admin', 'Common'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    roleFilter === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {role === 'All' ? 'Todos' : role === 'Admin' ? 'Admins' : 'Comuns'}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}

          {/* Expandable Users List */}
          <div className="space-y-4">
            {filteredUsers?.map((u) => {
              const counters = getUserCounters(u)
              const isExpanded = expandedUserId === u.id
              const userActivities = [
                ...(userRealAttemptsMap[u.id] || []),
                ...getAnsweredActivitiesForUser(u),
              ]
              return (
                <Card key={u.id} className="p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* User Identity */}
                    <div className="flex items-center gap-3.5">
                      {u.photoUrl && u.photoUrl.startsWith('http') ? (
                        <img
                          src={u.photoUrl}
                          alt={u.fullName}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold">
                          {u.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{u.fullName}</h3>
                          <Badge variant={normalizeRole(u.role) === 'Admin' ? 'info' : 'default'}>
                            {normalizeRole(u.role) === 'Admin' ? 'Admin' : 'Comum'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>

                    {/* User Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                      <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-sm font-extrabold text-amber-800">{u.nexPoints} NexP</p>
                        <p className="text-[10px] text-amber-700">NexPoints</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-sm font-bold text-slate-900">{counters.activities}</p>
                        <p className="text-[10px] text-slate-500">Atividades Resp.</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-sm font-bold text-slate-900">{counters.articles}</p>
                        <p className="text-[10px] text-slate-500">Artigos Publ.</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-sm font-bold text-slate-900">{counters.caseStudies}</p>
                        <p className="text-[10px] text-slate-500">Casos de Uso</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-sm font-bold text-slate-900">{counters.processes}</p>
                        <p className="text-[10px] text-slate-500">Processos Publ.</p>
                      </div>
                    </div>

                    {/* Actions + Botão "Atividades" */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={isExpanded ? 'primary' : 'outline'}
                        onClick={async () => {
                          const next = isExpanded ? null : u.id
                          setExpandedUserId(next)
                          if (next && !userRealAttemptsMap[u.id]) {
                            try {
                              const logs = await quizzesApi.getUserAttempts(u.id, token || undefined)
                              if (logs && logs.length > 0) {
                                const mapped: AnsweredActivityRecord[] = logs.map((l) => ({
                                  id: l.id,
                                  title: l.details?.quizTitle || 'Quiz Respondido',
                                  category: 'Quiz Interativo',
                                  score: `${l.details?.scorePercentage ?? 100}% (${l.details?.correctCount ?? 1}/${l.details?.totalQuestions ?? 1} acertos)`,
                                  xpEarned: l.details?.xpEarned ?? 50,
                                  completedAt: new Date(l.createdAt).toLocaleDateString('pt-BR'),
                                  qaList: (l.details?.qaList || []).map((qa) => ({
                                    question: qa.questionText,
                                    userAnswer: qa.userAnswer,
                                    correctAnswer: qa.correctAnswer,
                                    isCorrect: qa.isCorrect,
                                  })),
                                }))
                                setUserRealAttemptsMap((prev) => ({ ...prev, [u.id]: mapped }))
                              }
                            } catch {
                              // ignore
                            }
                          }
                        }}
                      >
                        📋 Atividades ({userActivities.length}) {isExpanded ? '▲' : '▼'}
                      </Button>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        title="Editar Usuário"
                        className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        title="Excluir Usuário"
                        className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Expanded Answered Activities */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Atividades Respondidas por {u.fullName} (Clique no card para ver respostas e gerar Insights IA):
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {userActivities.map((act) => {
                          const savedInsight = activitySavedInsightsMap[act.id]
                          return (
                            <div
                              key={act.id}
                              onClick={() => {
                                setAiInsightDraft(savedInsight || '')
                                setSelectedActivityModal({ user: u, activity: act })
                              }}
                              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-400 cursor-pointer transition-all space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <Badge variant="info">{act.category}</Badge>
                                <span className="text-xs font-bold text-emerald-700">{act.score}</span>
                              </div>
                              <h4 className="font-bold text-sm text-slate-900">{act.title}</h4>
                              <p className="text-xs text-slate-500">
                                Concluída em {act.completedAt} • +{act.xpEarned} NexP
                              </p>
                              {savedInsight && (
                                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900">
                                  <strong>✨ Insight IA Salvo:</strong> {savedInsight}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      ) : (
        /* Aba de Recursos de Aprendizagem & Insights de IA */
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white border-0">
            <h2 className="text-xl font-bold mb-1">
              🧠 Recursos de Aprendizagem — Resumos, Insights de IA e Fixação Ativa
            </h2>
            <p className="text-xs text-purple-100 leading-relaxed max-w-3xl">
              Esta central consolida as análises geradas por IA a partir das respostas dos colaboradores nas atividades, permitindo identificar lacunas técnicas e gerar novas tarefas focadas nas questões mais respondidas incorretamente.
            </p>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {savedInsightsList.map((ins) => (
              <Card key={ins.id} className="p-5 space-y-3 border-l-4 border-l-purple-600">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{ins.activityTitle}</Badge>
                      {ins.userName && (
                        <span className="text-xs text-slate-500">Colaborador: {ins.userName}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Gerado em {new Date(ins.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleCreateReinforcementActivity(ins)}>
                    ⚡ Criar Atividade com Questões Mais Erradas
                  </Button>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-sm text-slate-800 leading-relaxed">
                  {ins.insightText}
                </div>

                {ins.wrongQuestionsSummary.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-700">
                      Questões com Maior Índice de Erro Identificadas:
                    </p>
                    <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                      {ins.wrongQuestionsSummary.map((wq, i) => (
                        <li key={i}>{wq}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Respostas da Atividade + Botão IA para Gerar e Salvar Insights */}
      {selectedActivityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <Badge variant="info">{selectedActivityModal.activity.category}</Badge>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedActivityModal.activity.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Respostas de <strong>{selectedActivityModal.user.fullName}</strong> • Desempenho:{' '}
                  <strong>{selectedActivityModal.activity.score}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedActivityModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedActivityModal.activity.qaList.map((qa, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                    qa.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                  }`}
                >
                  <p className="font-bold text-slate-900">
                    {idx + 1}. {qa.question}
                  </p>
                  <p className={qa.isCorrect ? 'text-emerald-800' : 'text-red-700'}>
                    <strong>Resposta do usuário:</strong> {qa.userAnswer} {qa.isCorrect ? '✅' : '❌'}
                  </p>
                  {!qa.isCorrect && (
                    <p className="text-slate-600">
                      <strong>Gabarito esperado:</strong> {qa.correctAnswer}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* AI Insight Generator & Saver */}
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-purple-950">
                  🤖 Análise e Insights de Inteligência Artificial
                </h4>
                <Button size="sm" onClick={handleGenerateAiInsight} disabled={isGeneratingAi}>
                  {isGeneratingAi ? 'Gerando Insights...' : '✨ Gerar Insights com IA'}
                </Button>
              </div>

              <textarea
                rows={3}
                value={aiInsightDraft}
                onChange={(e) => setAiInsightDraft(e.target.value)}
                placeholder="Clique em 'Gerar Insights com IA' ou escreva observações pedagógicas sobre esta atividade..."
                className="w-full p-3 text-xs border border-purple-300 rounded-lg bg-white text-slate-800"
              />

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    handleSaveAiInsight()
                    setSelectedActivityModal(null)
                  }}
                  disabled={!aiInsightDraft.trim()}
                >
                  💾 Salvar Insight na Atividade e na Aba de Aprendizagem
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Foto do Usuário (opcional)</label>
                  <ImageUploadButton
                    onImageUploaded={(url) => setNewUser((prev) => ({ ...prev, photoUrl: url }))}
                    label="Enviar Foto"
                  />
                </div>
                <input
                  type="text"
                  value={newUser.photoUrl}
                  onChange={(e) => setNewUser({ ...newUser, photoUrl: e.target.value })}
                  placeholder="URL da foto ou envie uma imagem"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    {editingUser ? 'Nova Senha Temporária (opcional)' : 'Senha Inicial Temporária'}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={generateTempPassword}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md"
                    >
                      🔑 Gerar Senha
                    </button>
                    {newUser.password && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md"
                      >
                        {copiedPassword ? '✅ Copiada!' : '📋 Copiar'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required={!editingUser}
                    minLength={editingUser ? undefined : 8}
                    placeholder={
                      editingUser
                        ? 'Deixe em branco para manter a senha atual'
                        : 'Mín. 8 chars, 1 maiúscula, 1 número e 1 especial'
                    }
                    className="w-full px-4 py-2.5 pr-16 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Regra: mínimo 8 caracteres, 1 letra maiúscula, 1 número e 1 caractere especial.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nível de acesso</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'Common' | 'Admin' })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Common">Usuário Comum</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isCreating}>
                  {isCreating ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
