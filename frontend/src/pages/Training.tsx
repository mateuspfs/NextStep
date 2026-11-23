import { useState, useEffect } from 'react'
import {
  FileText,
  PenTool,
  ListChecks,
  Lightbulb,
  Zap,
  HelpCircle,
  Play,
  Trophy,
  BookOpen,
  ExternalLink,
  Users,
  X,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import {
  coursesApi,
  quizzesApi,
  ranksApi,
  badgesApi,
  processesApi,
  caseStudiesApi,
  usersApi,
  Course,
  QuizDto,
  QuizSubmissionResult,
  Badge as BadgeType,
} from '../services/api'
import { useApi } from '../hooks/useApi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import DescriptionRenderer from '../components/ui/DescriptionRenderer'
import { showToast, showXpToast, showConfirm } from '../utils/toast'

function TrainingIcon({ type }: { type: string }) {
  const icons: Record<string, JSX.Element> = {
    document: <FileText className="w-6 h-6" />,
    pencil: <PenTool className="w-6 h-6" />,
    list: <ListChecks className="w-6 h-6" />,
  }
  return icons[type] || null
}

interface GeneratedActivity {
  type: 'quiz' | 'open' | 'boolean'
  title: string
  question: string
  options: string[]
  correctIndex: number
  keywords?: string[]
  explanation: string
}

export default function Training() {
  const { user, token } = useAuth()
  const { badges, courses: userCourses, addXp, refreshCourses, refreshAll, isLoading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState('Todos')
  const [knowledgeBase, setKnowledgeBase] = useState('Política de Privacidade 2024')
  const [activityType, setActivityType] = useState('Múltipla Escolha (Quiz)')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedActivity, setGeneratedActivity] = useState<GeneratedActivity | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [openAnswerText, setOpenAnswerText] = useState('')
  const [isOpenAnswerValid, setIsOpenAnswerValid] = useState(false)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isAdvancingLesson, setIsAdvancingLesson] = useState(false)
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null)

  const isAdmin = user?.role === 'Admin'
  const [kbSearchQuery, setKbSearchQuery] = useState('')
  const [kbSources, setKbSources] = useState<
    { id: string; title: string; typeTag: string; categoryTag: string }[]
  >([
    { id: 'kb-1', title: 'Política de Privacidade 2024', typeTag: 'Processo', categoryTag: 'Segurança' },
    { id: 'kb-2', title: 'Guia de Estilo Editorial', typeTag: 'Artigo', categoryTag: 'Editorial' },
    { id: 'kb-3', title: 'Processos Internos e LGPD', typeTag: 'Processo', categoryTag: 'Compliance' },
    { id: 'kb-4', title: 'Resolução de Erros de APIs', typeTag: 'Estudo de Caso', categoryTag: 'Tecnologia' },
  ])
  const [technicalLevel, setTechnicalLevel] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Intermediário')
  const [customXp, setCustomXp] = useState(50)

  // Manual Activity / Multi-Question Quiz Creation Modal (Admin)
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [manualQuestions, setManualQuestions] = useState<
    { questionText: string; options: string[]; correctIndex: number }[]
  >([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctIndex: 0,
    },
  ])

  // Real Quizzes from Database (/api/quizzes) & Interactive Quiz Player Modal
  const [quizzesList, setQuizzesList] = useState<QuizDto[]>([])
  const [quizzesLoading, setQuizzesLoading] = useState(false)
  const [activeQuizModal, setActiveQuizModal] = useState<QuizDto | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, { optionId?: string; text?: string }>>({})
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null)
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false)

  // Bulk User Assignment Modal (Admin)
  const [showAssignUsersModal, setShowAssignUsersModal] = useState(false)
  const [allUsersList, setAllUsersList] = useState<{ id: string; fullName: string; email: string }[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [assignToast, setAssignToast] = useState<string | null>(null)

  // Activity List Filters
  const [activitySearch, setActivitySearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [typeFilter, setTypeFilter] = useState('Todos')

  // Full Ranking Modal + All Badges Modal
  const [showAllRankingModal, setShowAllRankingModal] = useState(false)
  const [rankingSearch, setRankingSearch] = useState('')
  const [rankingPage, setRankingPage] = useState(1)
  const [showAllBadgesModal, setShowAllBadgesModal] = useState(false)
  const [allBadgesCatalog, setAllBadgesCatalog] = useState<BadgeType[]>([])

  const loadQuizzes = async () => {
    setQuizzesLoading(true)
    try {
      const qData = await quizzesApi.getAll(token || undefined)
      if (qData) setQuizzesList(qData)
    } catch {
      // fallback handled
    } finally {
      setQuizzesLoading(false)
    }
  }

  useEffect(() => {
    loadQuizzes()
    Promise.allSettled([
      processesApi.getAll(token || undefined),
      caseStudiesApi.getAll(token || undefined),
      badgesApi.getAll(token || undefined),
      isAdmin ? usersApi.getAll(token || undefined) : Promise.resolve([]),
    ]).then(([procRes, csRes, badgeRes, usrRes]) => {
      const combined: { id: string; title: string; typeTag: string; categoryTag: string }[] = []
      if (procRes.status === 'fulfilled' && procRes.value) {
        procRes.value.forEach((p) =>
          combined.push({
            id: `p-${p.id}`,
            title: p.title,
            typeTag: 'Processo',
            categoryTag: p.category || 'Geral',
          })
        )
      }
      if (csRes.status === 'fulfilled' && csRes.value) {
        csRes.value.forEach((c) =>
          combined.push({
            id: `c-${c.id}`,
            title: c.title,
            typeTag: c.type === 1 ? 'Artigo' : c.type === 2 ? 'Erro Comum' : 'Estudo de Caso',
            categoryTag: c.categoryName || 'Geral',
          })
        )
      }
      if (combined.length > 0) {
        setKbSources(combined)
      }
      if (badgeRes.status === 'fulfilled' && badgeRes.value) {
        setAllBadgesCatalog(badgeRes.value)
      }
      if (usrRes.status === 'fulfilled' && Array.isArray(usrRes.value)) {
        setAllUsersList(usrRes.value)
      }
    })
  }, [token, isAdmin])

  const { data: courses, loading: coursesLoading } = useApi(
    () => coursesApi.getAll(token || undefined),
    [token]
  )

  const { data: leaderboard, loading: leaderboardLoading, refetch: refetchLeaderboard } = useApi(
    () => ranksApi.getLeaderboard(token || undefined),
    [token]
  )

  const fallbackCourses: Course[] = [
    {
      id: 'c1',
      title: 'Fundamentos de Segurança e LGPD',
      description: 'Aprenda os princípios fundamentais da Lei Geral de Proteção de Dados e segurança da informação aplicados ao dia a dia.',
      totalLessons: 6,
      totalXp: 120,
      level: 0,
      categoryId: 'seg',
      categoryName: 'Segurança',
      authorId: 'u1',
      authorName: 'Equipe de Compliance',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c2',
      title: 'Boas Práticas de Integrações de API',
      description: 'Como lidar com autenticação segura, rate limits e tratamento de erros conhecidos em integrações.',
      totalLessons: 8,
      totalXp: 180,
      level: 1,
      categoryId: 'tec',
      categoryName: 'Tecnologia',
      authorId: 'u2',
      authorName: 'Arquitetura de Software',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c3',
      title: 'Comunicação e Redação Editorial',
      description: 'Técnicas para produção de manuais, artigos e documentação clara e padronizada para os times.',
      totalLessons: 5,
      totalXp: 100,
      level: 0,
      categoryId: 'ed',
      categoryName: 'Editorial',
      authorId: 'u3',
      authorName: 'Comunicação Interna',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  const displayCourses = (courses && courses.length > 0) ? courses : fallbackCourses

  const filteredCourses = [...displayCourses]
    .filter((course) => {
      if (activeTab === 'Quizzes' && course.level !== 0) return false
      if (activeTab === 'Abertas' && course.level < 1) return false
      if (categoryFilter !== 'Todas' && (course.categoryName || 'Corporativo') !== categoryFilter) return false
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase()
        if (!course.title.toLowerCase().includes(q) && !course.description.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))

  const selectedKbMeta = kbSources.find((k) => k.title === knowledgeBase) || kbSources[0]
  const filteredKbSources = kbSources
    .filter((k) => !kbSearchQuery.trim() || k.title.toLowerCase().includes(kbSearchQuery.toLowerCase()))
    .slice(0, 10)

  const quizBank: Record<string, GeneratedActivity> = {
    'Política de Privacidade 2024': {
      type: 'quiz',
      title: 'Atividade Prática: Política de Privacidade 2024',
      question: 'De acordo com as diretrizes de "Política de Privacidade 2024", qual é a conduta padrão exigida para incidentes de acesso não autorizado ou vazamento de dados pessoais?',
      options: [
        'Ignorar temporariamente se não houver impacto imediato percebido.',
        'Notificar imediatamente o time de Segurança/DPO e registrar o incidente na Central de Erros Conhecidos.',
        'Reiniciar o servidor sem guardar logs de auditoria.',
        'Excluir a conta do usuário envolvido sem notificação.'
      ],
      correctIndex: 1,
      keywords: ['dpo', 'segurança', 'notificar', 'lgpd', 'auditoria', 'incidente', 'logs'],
      explanation: 'Correto! A resposta em conformidade com a LGPD exige notificação imediata ao DPO/Segurança e preservação de logs para mitigação.'
    },
    'Guia de Estilo Editorial': {
      type: 'quiz',
      title: 'Atividade Prática: Guia de Estilo Editorial',
      question: 'Qual é a recomendação essencial do Guia de Estilo Editorial antes de publicar um novo manual técnico na base de conhecimento?',
      options: [
        'Publicar diretamente sem revisão para agilizar a entrega.',
        'Utilizar jargões sem explicação e omitir pré-requisitos.',
        'Submeter pelo Fluxo de Revisão Editorial garantindo tom de voz claro, passos numerados e validação técnica.',
        'Restringir o acesso apenas para administradores.'
      ],
      correctIndex: 2,
      keywords: ['revisão', 'claro', 'padronização', 'validação', 'etapas', 'editorial'],
      explanation: 'Perfeito! Todo manual corporativo deve passar pelo fluxo de revisão e ter etapas testadas e objetivas.'
    },
    'Processos Internos e LGPD': {
      type: 'quiz',
      title: 'Atividade Prática: Processos Internos e LGPD',
      question: 'Ao realizar a redefinição de credenciais de contas Master corporativas, qual requisito de segurança é obrigatório?',
      options: [
        'Enviar a nova senha em texto puro por chat.',
        'Exigir duplo fator de autenticação (2FA) e link temporário com expiração de 15 minutos e trilha de auditoria.',
        'Utilizar uma senha padrão compartilhada pela equipe.',
        'Desativar os alertas de login por 24 horas.'
      ],
      correctIndex: 1,
      keywords: ['2fa', 'duplo fator', 'auditoria', 'temporário', 'expiração', 'criptografado'],
      explanation: 'Exato! O procedimento homologado exige 2FA obrigatório, expiração curta de token e log criptografado.'
    },
    'Resolução de Erros de APIs': {
      type: 'quiz',
      title: 'Atividade Prática: Resolução de Erros de APIs',
      question: 'Como resolver falhas de timeout e latência alta em webhooks de integração com sistemas legados?',
      options: [
        'Aumentar o timeout do cliente indefinidamente e bloquear a thread.',
        'Desacoplar o recebimento usando fila assíncrona (RabbitMQ/SQS) respondendo HTTP 200 imediato e retry com backoff.',
        'Desligar a validação de assinatura do webhook.',
        'Reprocessar manualmente banco a banco uma vez por mês.'
      ],
      correctIndex: 1,
      keywords: ['fila', 'assíncrona', 'sqs', 'rabbitmq', 'retry', 'idempotência', 'webhook'],
      explanation: 'Excelente! Filas assíncronas e idempotência resolvem gargalos de webhooks e estão documentadas na Central de Erros Conhecidos.'
    }
  }

  const handleGenerateTraining = async () => {
    setIsGenerating(true)
    setGeneratedActivity(null)
    setSelectedOption(null)
    setOpenAnswerText('')
    setIsOpenAnswerValid(false)
    setHasAnswered(false)

    const lvlNum = technicalLevel === 'Iniciante' ? 0 : technicalLevel === 'Intermediário' ? 1 : 2
    const kbMeta = kbSources.find((k) => k.title === knowledgeBase)

    try {
      const createdQuiz = await quizzesApi.generateWithAi(
        {
          topicTitle: knowledgeBase,
          category: kbMeta?.categoryTag || 'Geral',
          modality: activityType,
          level: lvlNum,
          xpAmount: customXp,
          saveToDatabase: true,
        },
        token || undefined
      )
      await loadQuizzes()
      setIsGenerating(false)
      showToast('Quiz gerado com IA!', {
        type: 'success',
        subtitle: `"${createdQuiz.title}" foi salvo e aberto para resolução.`,
      })
      handleOpenQuizPlayer(createdQuiz)
      return
    } catch {
      // Fallback local interactive preview if backend unreachable
    }

    setTimeout(() => {
      setIsGenerating(false)
      const base = quizBank[knowledgeBase] || quizBank['Política de Privacidade 2024']
      if (activityType === 'Verdadeiro ou Falso') {
        setGeneratedActivity({
          ...base,
          type: 'boolean',
          title: `Desafio V/F: ${knowledgeBase}`,
          question: `Julgue a afirmação sobre "${knowledgeBase}": "${base.options[base.correctIndex]}"`,
          options: ['Verdadeiro (Em conformidade com o padrão NextStep)', 'Falso (Viola as diretrizes internas)'],
          correctIndex: 0,
        })
      } else if (activityType === 'Perguntas Abertas') {
        setGeneratedActivity({
          ...base,
          type: 'open',
          title: `Questão Discursiva: ${knowledgeBase}`,
        })
      } else {
        setGeneratedActivity({ ...base, type: 'quiz' })
      }
    }, 500)
  }

  const handleConfirmQuizAnswer = async () => {
    if (!generatedActivity) return
    setHasAnswered(true)

    if (generatedActivity.type === 'open') {
      const normalized = openAnswerText.trim().toLowerCase()
      const matchesKeyword = (generatedActivity.keywords || []).some((kw) => normalized.includes(kw))
      const valid = normalized.length >= 15 || matchesKeyword
      setIsOpenAnswerValid(valid)
      if (valid) {
        await addXp(35)
        refetchLeaderboard()
      }
      return
    }

    if (selectedOption === null) return
    if (selectedOption === generatedActivity.correctIndex) {
      await addXp(35)
      refetchLeaderboard()
    }
  }

  const getSelectedUserCourse = (courseId: string) => {
    return userCourses?.find((uc) => uc.courseId === courseId)
  }

  const handleOpenQuizPlayer = (quiz: QuizDto) => {
    setActiveQuizModal(quiz)
    setQuizAnswers({})
    setQuizResult(null)
  }

  const handleSubmitActiveQuiz = async () => {
    if (!activeQuizModal) return
    setIsSubmittingQuiz(true)
    try {
      const formattedAnswers = activeQuizModal.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: quizAnswers[q.id]?.optionId,
        answerText: quizAnswers[q.id]?.text,
      }))
      const res = await quizzesApi.submit(
        activeQuizModal.id,
        {
          userId: user?.id,
          answers: formattedAnswers,
        },
        token || undefined
      )
      setQuizResult(res)
      if (!isAdmin && res.xpEarned > 0) {
        showXpToast(res.xpEarned, `Quiz concluído (${res.scorePercentage}% de acerto)`)
      } else {
        showToast(`Quiz finalizado: ${res.scorePercentage}% de acerto`, { type: 'info' })
      }
      await refreshAll()
      refetchLeaderboard()
      await loadQuizzes()
    } catch {
      // Local evaluation fallback
      let correctCount = 0
      const qResults = activeQuizModal.questions.map((q) => {
        const ans = quizAnswers[q.id]
        const correctOpt = q.options.find((o) => o.isCorrect)
        const chosenOpt = q.options.find((o) => o.id === ans?.optionId)
        const isCorrect = Boolean(chosenOpt?.isCorrect)
        if (isCorrect) correctCount++
        return {
          questionId: q.id,
          questionText: q.questionText,
          userAnswer: chosenOpt?.optionText || ans?.text || 'Não respondida',
          correctAnswer: correctOpt?.optionText || '',
          isCorrect,
        }
      })
      const total = Math.max(1, activeQuizModal.questions.length)
      const pct = Math.round((correctCount / total) * 100)
      const xpEarned = pct >= 60 ? activeQuizModal.xpAmount : 15
      await addXp(xpEarned)
      setQuizResult({
        quizId: activeQuizModal.id,
        quizTitle: activeQuizModal.title,
        scorePercentage: pct,
        correctCount,
        totalQuestions: activeQuizModal.questions.length,
        passed: pct >= 60,
        xpEarned,
        questionResults: qResults,
      })
    } finally {
      setIsSubmittingQuiz(false)
    }
  }

  const filteredQuizzes = [...quizzesList]
    .filter((q) => {
      if (activeTab === 'Quizzes' && q.level !== 0) return false
      if (activeTab === 'Abertas' && q.level < 1) return false
      if (categoryFilter !== 'Todas' && q.category !== categoryFilter) return false
      if (
        typeFilter !== 'Todos' &&
        !q.modality.toLowerCase().includes(typeFilter.toLowerCase())
      ) {
        return false
      }
      if (activitySearch.trim()) {
        const s = activitySearch.toLowerCase()
        if (
          !q.title.toLowerCase().includes(s) &&
          !q.description.toLowerCase().includes(s) &&
          !q.sourceTitle.toLowerCase().includes(s)
        ) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))

  const handleAdvanceLesson = async (course: Course) => {
    setIsAdvancingLesson(true)
    setLessonFeedback(null)
    try {
      const updated = await coursesApi.advanceLesson(course.id, token || undefined)
      await addXp(15)
      await refreshCourses()
      await refreshAll()
      refetchLeaderboard()
      if (updated.isCompleted) {
        setLessonFeedback(`🎉 Parabéns! Você concluiu 100% do curso "${course.title}" e recebeu a recompensa total!`)
      } else {
        setLessonFeedback(`✅ Módulo concluído! Progresso atual: ${updated.completedLessons}/${updated.totalLessons} (${updated.progressPercentage}%) • +15 XP`)
      }
    } catch {
      await addXp(15)
      setLessonFeedback(`✅ Módulo de estudo registrado com sucesso! Você ganhou +15 XP.`)
    } finally {
      setIsAdvancingLesson(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Carregando dados...</p>
        </div>
      </div>
    )
  }

  const activeUserCourse = selectedCourse ? getSelectedUserCourse(selectedCourse.id) : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Central de Aprendizado</p>
          <h1 className="text-3xl font-bold text-slate-900">Atividades e Treinamentos</h1>
          <p className="text-slate-600 mt-1">Aprimore suas competências, realize quizzes interativos e ganhe pontos de experiência.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">AS</div>
            <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">CM</div>
            <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">ML</div>
          </div>
          <span className="text-sm text-slate-600 font-medium">12 colegas online agora</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Training Generator */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Gerador de Treinamentos com IA</h3>
                <p className="text-sm text-slate-500">Crie desafios e perguntas personalizadas a partir dos documentos internos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Base de Conhecimento (10 primeiros registros)
                  </label>
                  {selectedKbMeta && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {selectedKbMeta.typeTag} • {selectedKbMeta.categoryTag}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={kbSearchQuery}
                  onChange={(e) => setKbSearchQuery(e.target.value)}
                  placeholder="Pesquisar item da base pelo nome..."
                  className="w-full px-3 py-1.5 mb-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <select
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  {filteredKbSources.map((kb) => (
                    <option key={kb.id} value={kb.title}>
                      {kb.title} ({kb.typeTag} - {kb.categoryTag})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Atividade</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option>Múltipla Escolha (Quiz)</option>
                    <option>Perguntas Abertas</option>
                    <option>Arrastar e Soltar</option>
                    <option>Preencher Lacunas</option>
                    <option>Verdadeiro ou Falso</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nível Técnico</label>
                    <select
                      value={technicalLevel}
                      onChange={(e) => setTechnicalLevel(e.target.value as typeof technicalLevel)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Recompensa (XP)</label>
                    <input
                      type="number"
                      min={10}
                      value={customXp}
                      onChange={(e) => setCustomXp(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={handleGenerateTraining} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sintetizando atividade com IA...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-1.5" /> Gerar Atividade por IA (+{customXp} XP)
                  </>
                )}
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={() => setShowManualModal(true)}>
                  <PenTool className="w-4 h-4 mr-1.5" /> Criar Atividade Manualmente
                </Button>
              )}
            </div>

            {/* Generated Activity Interactive Box */}
            {generatedActivity && (
              <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <Badge variant="info">Atividade Gerada</Badge>
                  <span className="text-xs font-bold text-blue-700">+35 XP</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{generatedActivity.title}</h4>
                  <p className="text-sm text-slate-700 font-medium">{generatedActivity.question}</p>
                </div>
                {generatedActivity.type === 'open' ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      disabled={hasAnswered}
                      value={openAnswerText}
                      onChange={(e) => setOpenAnswerText(e.target.value)}
                      placeholder="Escreva sua análise técnica com base nas diretrizes do processo..."
                      className="w-full p-3 rounded-lg text-sm border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                    />
                    {generatedActivity.keywords && (
                      <p className="text-[11px] text-slate-500">
                        Conceitos esperados: {generatedActivity.keywords.slice(0, 4).join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {generatedActivity.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => !hasAnswered && setSelectedOption(idx)}
                        disabled={hasAnswered}
                        className={`w-full text-left p-3 rounded-lg text-sm border transition-all ${
                          selectedOption === idx
                            ? hasAnswered
                              ? idx === generatedActivity.correctIndex
                                ? 'bg-green-100 border-green-400 text-green-900 font-medium'
                                : 'bg-red-100 border-red-400 text-red-900'
                              : 'bg-blue-100 border-blue-400 text-blue-900 font-medium'
                            : hasAnswered && idx === generatedActivity.correctIndex
                            ? 'bg-green-100 border-green-400 text-green-900 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + idx)})</span>
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {!hasAnswered ? (
                  <Button
                    className="w-full"
                    disabled={generatedActivity.type === 'open' ? openAnswerText.trim().length < 5 : selectedOption === null}
                    onClick={handleConfirmQuizAnswer}
                  >
                    Confirmar Resposta
                  </Button>
                ) : (
                  <div className="p-3 bg-white border rounded-lg text-xs space-y-1">
                    {generatedActivity.type === 'open' ? (
                      <p className={`font-semibold ${isOpenAnswerValid ? 'text-green-700' : 'text-amber-700'}`}>
                        {isOpenAnswerValid
                          ? '🎉 Excelente síntese! Você ganhou +35 XP no seu perfil!'
                          : '💡 Resposta muito curta. Confira a resposta de referência:'}
                      </p>
                    ) : (
                      <p className={`font-semibold ${selectedOption === generatedActivity.correctIndex ? 'text-green-700' : 'text-red-700'}`}>
                        {selectedOption === generatedActivity.correctIndex ? '🎉 Resposta Correta! Você ganhou +35 XP no seu perfil!' : '❌ Incorreto. Veja o gabarito comentado:'}
                      </p>
                    )}
                    <p className="text-slate-600">{generatedActivity.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Available Trainings / Activities (Sorted Alphabetically + Fixed Height Scroll Container) */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {isAdmin ? 'Todas as Atividades Cadastradas (Ordem Alfabética)' : 'Atividades Vinculadas'}
                </h3>
                <p className="text-xs text-slate-500">
                  Container com rolagem interna • Filtre por categoria, tipo ou nível técnico
                </p>
              </div>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {[
                  { id: 'Todos', label: 'Todos Níveis' },
                  { id: 'Quizzes', label: 'Iniciante' },
                  { id: 'Abertas', label: 'Intermediário/Avançado' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Pesquisar atividade pelo título ou descrição..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Todas">Todas Categorias</option>
                {Array.from(new Set(displayCourses.map((c) => c.categoryName || 'Corporativo'))).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Todos">Todos os Tipos</option>
                <option value="Múltipla Escolha">Múltipla Escolha</option>
                <option value="Dissertativa">Dissertativa</option>
                <option value="Arrastar e Soltar">Arrastar e Soltar</option>
                <option value="Preencher Lacunas">Preencher Lacunas</option>
              </select>
            </div>

            {coursesLoading && quizzesLoading ? (
              <div className="text-center py-8 text-slate-500">Carregando quizzes e atividades...</div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {/* Interactive Quizzes from Database */}
                {filteredQuizzes.map((quiz) => (
                  <Card
                    key={quiz.id}
                    onClick={() => handleOpenQuizPlayer(quiz)}
                    className="p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group border-l-4 border-l-blue-600"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                          <HelpCircle className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {quiz.title}
                            </h4>
                            <Badge variant="info">{quiz.category}</Badge>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              {quiz.modality}
                            </span>
                            {quiz.userCompleted && (
                              <Badge variant="success">Concluído ({quiz.userScore}%)</Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {quiz.questionsCount} questões • +{quiz.xpAmount} XP • Nível {quiz.levelLabel} • Base:{' '}
                            <strong>{quiz.sourceTitle}</strong>
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant={quiz.userCompleted ? 'outline' : 'primary'} className="shrink-0">
                        {quiz.userCompleted ? (
                          'Refazer Quiz'
                        ) : (
                          <>
                            Iniciar Quiz <Play className="w-3.5 h-3.5 ml-1 fill-current" />
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}

                {/* Courses / Trainings */}
                {filteredCourses.map((course) => {
                  const uc = getSelectedUserCourse(course.id)
                  return (
                    <Card
                      key={course.id}
                      onClick={() => {
                        setSelectedCourse(course)
                        setLessonFeedback(null)
                      }}
                      className="p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-12 h-12 rounded-lg object-cover shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                            <TrainingIcon type="document" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {course.title}
                            </h4>
                            {uc?.isCompleted && (
                              <Badge variant="success">Concluído</Badge>
                            )}
                            {uc && !uc.isCompleted && (
                              <Badge variant="info">{uc.progressPercentage}%</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">
                            {course.totalLessons} lições • {course.totalXp} XP • Nível {course.level === 0 ? 'Iniciante' : course.level === 1 ? 'Intermediário' : 'Avançado'}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Global Ranking (Top 20 + Pódio + Modal Ver Mais) */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Ranking Geral (Top 20)</h3>
                <p className="text-xs text-slate-500">Destaque no pódio corporativo</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRankingPage(1)
                  setShowAllRankingModal(true)
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Ver mais
              </button>
            </div>
            {leaderboardLoading ? (
              <div className="text-center py-4 text-slate-500">Carregando ranking...</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {leaderboard && leaderboard.length > 0 ? (
                  leaderboard.slice(0, 20).map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        entry.userId === user?.id ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <span className={`text-sm font-bold w-6 ${entry.position === 1 ? 'text-amber-500' : entry.position === 2 ? 'text-slate-400' : entry.position === 3 ? 'text-amber-700' : 'text-slate-500'}`}>
                        #{entry.position}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{entry.userName}</p>
                        <p className="text-xs text-slate-500">{entry.rankName}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{entry.totalXp} pts</span>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    {[
                      { name: 'Ana Silva', pts: 1250, pos: 1 },
                      { name: 'Carlos Mendes', pts: 980, pos: 2 },
                      { name: 'Rodrigo Alencar', pts: 840, pos: 3 },
                      { name: user?.fullName || 'Você', pts: 520, pos: 4 },
                    ].map((entry) => (
                      <div key={entry.pos} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                        <span className={`text-sm font-bold w-6 ${entry.pos === 1 ? 'text-amber-500' : 'text-slate-500'}`}>
                          #{entry.pos}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{entry.name}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{entry.pts} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Recent Achievements (Apenas Usuário Comum — Admin não possui badges pessoais) */}
          {!isAdmin && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Conquistas Recentes (5)</h3>
                <p className="text-xs text-slate-500">Clique para ver todos os emblemas</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllBadgesModal(true)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Ver Todos
              </button>
            </div>
            <div className="space-y-2.5 cursor-pointer" onClick={() => setShowAllBadgesModal(true)}>
              {badges && badges.length > 0 ? (
                badges.slice(0, 5).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{badge.badgeName}</p>
                      <p className="text-xs text-slate-600 truncate">{badge.badgeDescription}</p>
                    </div>
                  </div>
                ))
              ) : (
                ['Primeiro Treinamento', 'Mestre em Processos', 'Ofensiva 7 Dias', 'Colaborador Ativo'].map((badgeName, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 w-full"
                  >
                    <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{badgeName}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
          )}
        </div>
      </div>

      {/* Course Detail & Study Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="info" className="mb-2">
                  {selectedCourse.level === 0 ? 'Nível Iniciante' : selectedCourse.level === 1 ? 'Nível Intermediário' : 'Nível Avançado'}
                </Badge>
                <h3 className="text-xl font-bold text-slate-900">{selectedCourse.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Autor: {selectedCourse.authorName} • Categoria: {selectedCourse.categoryName || 'Corporativo'}</p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedCourse.thumbnailUrl && (
              <img
                src={selectedCourse.thumbnailUrl}
                alt={selectedCourse.title}
                className="w-full h-44 rounded-lg object-cover shadow-xs"
              />
            )}

            <div className="bg-slate-50 p-4 rounded-lg">
              <DescriptionRenderer content={selectedCourse.description} />
            </div>

            {activeUserCourse && (
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    Seu Progresso: {activeUserCourse.completedLessons} de {activeUserCourse.totalLessons} módulos
                  </span>
                  <span className="font-bold text-blue-700">{activeUserCourse.progressPercentage}%</span>
                </div>
                <ProgressBar value={activeUserCourse.progressPercentage} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <span className="block text-xl font-bold text-blue-700">{selectedCourse.totalLessons}</span>
                <span className="text-xs text-blue-600">Módulos / Lições</span>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <span className="block text-xl font-bold text-green-700">+{selectedCourse.totalXp} XP</span>
                <span className="text-xs text-green-600">Recompensa Total</span>
              </div>
            </div>

            {lessonFeedback && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-800">
                {lessonFeedback}
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('/training', '_blank')}
                >
                  Abrir em Guia Externa <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAssignUsersModal(true)}
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" /> Vincular Usuários em Massa
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedCourse(null)}>
                  Fechar
                </Button>
                {(!activeUserCourse || !activeUserCourse.isCompleted) && (
                  <Button
                    disabled={isAdvancingLesson}
                    onClick={() => handleAdvanceLesson(selectedCourse)}
                  >
                    {isAdvancingLesson
                      ? 'Registrando...'
                      : activeUserCourse
                      ? 'Concluir Próximo Módulo (+15 XP)'
                      : 'Iniciar e Concluir 1º Módulo (+15 XP)'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Quiz / Atividade Manualmente com Múltiplas Questões (Admin) */}
      {showManualModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Criar Novo Quiz Manualmente</h3>
                <p className="text-xs text-slate-500">
                  Cadastre múltiplas perguntas e marque a alternativa correta para cada questão
                </p>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">
                ✕
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const lvlNum = technicalLevel === 'Iniciante' ? 0 : technicalLevel === 'Intermediário' ? 1 : 2
                const kbMeta = kbSources.find((k) => k.title === knowledgeBase)
                try {
                  const created = await quizzesApi.create(
                    {
                      title: manualTitle.trim() || `Quiz: ${knowledgeBase}`,
                      description: manualDesc.trim() || `Avaliação técnica sobre ${knowledgeBase}`,
                      category: kbMeta?.categoryTag || 'Geral',
                      modality: activityType,
                      sourceTitle: knowledgeBase,
                      xpAmount: customXp,
                      level: lvlNum,
                      questions: manualQuestions
                        .filter((mq) => mq.questionText.trim())
                        .map((mq) => ({
                          questionText: mq.questionText.trim(),
                          options: mq.options
                            .filter((opt) => opt.trim())
                            .map((opt, idx) => ({
                              optionText: opt.trim(),
                              isCorrect: idx === mq.correctIndex,
                            })),
                        })),
                    },
                    token || undefined
                  )
                  await loadQuizzes()
                  setShowManualModal(false)
                  setManualTitle('')
                  setManualDesc('')
                  handleOpenQuizPlayer(created)
                } catch {
                  setShowManualModal(false)
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Quiz *</label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Ex.: Quiz de Segurança e LGPD"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Vinculada</label>
                  <input
                    type="text"
                    readOnly
                    value={`${knowledgeBase} (${activityType})`}
                    className="w-full px-3 py-2 text-sm border border-slate-200 bg-slate-50 rounded-lg text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Instruções *</label>
                <textarea
                  rows={2}
                  required
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="Objetivo técnico e orientações para responder o quiz..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    Perguntas do Quiz ({manualQuestions.length})
                  </h4>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setManualQuestions((prev) => [
                        ...prev,
                        { questionText: '', options: ['', '', '', ''], correctIndex: 0 },
                      ])
                    }
                  >
                    + Adicionar Pergunta
                  </Button>
                </div>

                {manualQuestions.map((mq, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700">Questão #{qIdx + 1}</span>
                      {manualQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setManualQuestions((prev) => prev.filter((_, i) => i !== qIdx))
                          }
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remover questão
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={mq.questionText}
                      onChange={(e) => {
                        const val = e.target.value
                        setManualQuestions((prev) =>
                          prev.map((item, i) => (i === qIdx ? { ...item, questionText: val } : item))
                        )
                      }}
                      placeholder="Digite o enunciado da pergunta..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                    />
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500">
                        Preencha as alternativas e marque o botão de rádio na alternativa correta:
                      </p>
                      {mq.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-q-${qIdx}`}
                            checked={mq.correctIndex === oIdx}
                            onChange={() =>
                              setManualQuestions((prev) =>
                                prev.map((item, i) => (i === qIdx ? { ...item, correctIndex: oIdx } : item))
                              )
                            }
                            title="Marcar como alternativa correta"
                          />
                          <input
                            type="text"
                            required={oIdx < 2}
                            value={opt}
                            onChange={(e) => {
                              const val = e.target.value
                              setManualQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIdx
                                    ? {
                                        ...item,
                                        options: item.options.map((o, j) => (j === oIdx ? val : o)),
                                      }
                                    : item
                                )
                              )
                            }}
                            placeholder={`Alternativa ${String.fromCharCode(65 + oIdx)}${
                              mq.correctIndex === oIdx ? ' (Correta ✓)' : ''
                            }`}
                            className={`flex-1 px-3 py-1.5 text-xs border rounded-lg ${
                              mq.correctIndex === oIdx
                                ? 'border-emerald-400 bg-emerald-50/40 font-semibold'
                                : 'border-slate-300 bg-white'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setShowManualModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar e Publicar Quiz</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Interactive Multi-Question Quiz Player */}
      {activeQuizModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl p-6 max-h-[92vh] overflow-y-auto space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="info">{activeQuizModal.category}</Badge>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    {activeQuizModal.modality}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Nível {activeQuizModal.levelLabel} • +{activeQuizModal.xpAmount} XP
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">{activeQuizModal.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Base de referência: <strong>{activeQuizModal.sourceTitle}</strong> • {activeQuizModal.questions.length} questões
                </p>
              </div>
              <button
                onClick={() => setActiveQuizModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg px-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quiz Result Summary (after submission) */}
            {quizResult ? (
              <div className="space-y-4">
                <div
                  className={`p-5 rounded-2xl border text-center space-y-2 ${
                    quizResult.passed
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex justify-center">
                    {quizResult.passed ? (
                      <Trophy className="w-10 h-10 text-emerald-600" />
                    ) : (
                      <BookOpen className="w-10 h-10 text-amber-600" />
                    )}
                  </div>
                  <h4 className="text-xl font-extrabold">
                    Aproveitamento: {quizResult.scorePercentage}% ({quizResult.correctCount} de{' '}
                    {quizResult.totalQuestions} acertos)
                  </h4>
                  <p className="text-sm font-semibold">
                    Você recebeu <strong>+{quizResult.xpEarned} XP</strong> no Ranking e nas suas Estatísticas!
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="text-sm font-bold text-slate-900">Gabarito Detalhado das Questões:</h5>
                  {quizResult.questionResults.map((qr, idx) => (
                    <div
                      key={qr.questionId || idx}
                      className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                        qr.isCorrect
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-red-50/50 border-red-200'
                      }`}
                    >
                      <p className="font-bold text-slate-900 text-sm">
                        {idx + 1}. {qr.questionText}
                      </p>
                      <p className={`inline-flex items-center gap-1.5 ${qr.isCorrect ? 'text-emerald-800 font-semibold' : 'text-red-700 font-semibold'}`}>
                        Sua resposta: {qr.userAnswer}{' '}
                        {qr.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </p>
                      {!qr.isCorrect && (
                        <p className="text-slate-700">
                          <strong>Resposta correta:</strong> {qr.correctAnswer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuizResult(null)
                      setQuizAnswers({})
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Tentar Novamente
                  </Button>
                  <Button onClick={() => setActiveQuizModal(null)}>Concluir e Fechar</Button>
                </div>
              </div>
            ) : (
              /* Active Quiz Questions Form */
              <div className="space-y-5">
                <p className="text-xs text-slate-600">{activeQuizModal.description}</p>

                {activeQuizModal.questions.map((q, qIdx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="font-bold text-slate-900 text-sm">
                      <span className="text-blue-600 mr-1.5">Questão {qIdx + 1}:</span>
                      {q.questionText}
                    </p>

                    {activeQuizModal.modality.toLowerCase().includes('dissertativa') ||
                    q.options.length === 0 ? (
                      <textarea
                        rows={3}
                        value={quizAnswers[q.id]?.text || ''}
                        onChange={(e) =>
                          setQuizAnswers((prev) => ({
                            ...prev,
                            [q.id]: { text: e.target.value },
                          }))
                        }
                        placeholder="Digite sua resposta técnica detalhada..."
                        className="w-full p-3 text-sm border border-slate-300 rounded-lg bg-white"
                      />
                    ) : (
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const selected = quizAnswers[q.id]?.optionId === opt.id
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: { optionId: opt.id },
                                }))
                              }
                              className={`w-full text-left p-3 rounded-lg text-sm border transition-all flex items-center justify-between ${
                                selected
                                  ? 'bg-blue-100 border-blue-500 text-blue-950 font-semibold shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>
                                <strong className="mr-2">{String.fromCharCode(65 + oIdx)})</strong>
                                {opt.optionText}
                              </span>
                              {isAdmin && opt.isCorrect && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0 ml-2">
                                  Gabarito Admin ✓
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAssignUsersModal(true)}
                        >
                          <Users className="w-3.5 h-3.5 mr-1.5" /> Vincular Usuários em Massa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={async () => {
                            const ok = await showConfirm({
                              title: 'Excluir Quiz?',
                              message: `Deseja excluir o quiz "${activeQuizModal.title}" permanentemente?`,
                              confirmText: 'Sim, Excluir',
                              cancelText: 'Cancelar',
                              variant: 'danger',
                            })
                            if (!ok) return
                            try {
                              await quizzesApi.delete(activeQuizModal.id, token || undefined)
                              await loadQuizzes()
                              setActiveQuizModal(null)
                              showToast('Quiz excluído!', { type: 'info', subtitle: activeQuizModal.title })
                            } catch {
                              setActiveQuizModal(null)
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir Quiz
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setActiveQuizModal(null)}>
                      Cancelar
                    </Button>
                    <Button
                      disabled={isSubmittingQuiz}
                      onClick={handleSubmitActiveQuiz}
                    >
                      {isSubmittingQuiz ? (
                        'Avaliando Respostas...'
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Finalizar e Enviar Respostas
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal: Vincular Usuários em Massa (Admin) */}
      {showAssignUsersModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Vincular Usuários em Massa</h3>
              <button onClick={() => setShowAssignUsersModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Selecione os colaboradores que receberão esta atividade obrigatória em sua trilha:
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {allUsersList.map((u) => {
                const checked = selectedUserIds.includes(u.id)
                return (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedUserIds((prev) =>
                          checked ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                        )
                      }
                    />
                    <div>
                      <p className="font-bold text-slate-900">{u.fullName}</p>
                      <p className="text-slate-500">{u.email}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            {assignToast && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-semibold">
                {assignToast}
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserIds(allUsersList.map((u) => u.id))}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Selecionar Todos
              </button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowAssignUsersModal(false)}>
                  Fechar
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    const targetIds = selectedUserIds.length > 0 ? selectedUserIds : allUsersList.map((u) => u.id)
                    if (activeQuizModal) {
                      try {
                        await quizzesApi.assignUsers(activeQuizModal.id, targetIds, token || undefined)
                        await loadQuizzes()
                      } catch {
                        // fallback
                      }
                    }
                    setAssignToast(`✅ ${targetIds.length} colaborador(es) vinculados com sucesso!`)
                    showToast('Usuários vinculados em massa!', {
                      type: 'success',
                      subtitle: `${targetIds.length} colaborador(es) vinculados à atividade.`,
                    })
                    setTimeout(() => {
                      setAssignToast(null)
                      setShowAssignUsersModal(false)
                    }, 1500)
                  }}
                >
                  Confirmar Vínculo
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Todos os Usuários do Ranking com Busca e Paginação */}
      {showAllRankingModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Ranking Completo de Usuários</h3>
              <button onClick={() => setShowAllRankingModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <input
              type="text"
              value={rankingSearch}
              onChange={(e) => {
                setRankingSearch(e.target.value)
                setRankingPage(1)
              }}
              placeholder="Pesquisar colaborador no ranking..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {(leaderboard || [])
                .filter((e) => !rankingSearch.trim() || e.userName.toLowerCase().includes(rankingSearch.toLowerCase()))
                .slice((rankingPage - 1) * 10, rankingPage * 10)
                .map((entry) => (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-blue-600">#{entry.position}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{entry.userName}</p>
                        <p className="text-xs text-slate-500">{entry.rankName}</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900">{entry.totalXp} XP</span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Todos os Emblemas e Como Ganhar */}
      {showAllBadgesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Todos os Emblemas Disponíveis</h3>
                <p className="text-xs text-slate-500">Confira a descrição de como desbloquear cada conquista</p>
              </div>
              <button onClick={() => setShowAllBadgesModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allBadgesCatalog.map((b) => (
                <div key={b.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" /> {b.name}
                    </h4>
                    <Badge variant="info">{b.requiredPoints} XP</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{b.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
