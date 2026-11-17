import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import DescriptionField from '../components/ui/DescriptionField'
import DescriptionRenderer from '../components/ui/DescriptionRenderer'
import TopicMediaPreview from '../components/ui/TopicMediaPreview'
import ImageFullscreenModal from '../components/ui/ImageFullscreenModal'
import { useAuth } from '../contexts/AuthContext'
import { forumApi, caseStudiesApi, categoriesApi } from '../services/api'
import { getItemVote, toggleItemVote } from '../utils/nexpStore'

export interface CaseStudy {
  id: number | string
  title: string
  subtitle?: string
  description: string
  fullContent?: string
  author: string
  date: string
  category: string
  type?: 'Estudo de Caso' | 'Artigo' | 'Erro Comum'
  image: string
}

export interface ForumComment {
  id: string | number
  author: string
  time: string
  content: string
  votes: number
  isSolution?: boolean
}

export interface ForumQuestion {
  id: number | string
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
  comments: ForumComment[]
}

export interface CommonErrorItem {
  id: number | string
  title: string
  description: string
  type: 'error' | 'warning'
  category: string
  severity: 'Crítico' | 'Moderado' | 'Aviso'
  solution: string
  stepsToFix?: string[]
  source: 'Sistema' | 'Fórum'
  relatedForumId?: number | string
}

const initialCaseStudies: CaseStudy[] = [
  {
    id: 1,
    title: 'Reestruturação da Campanha Q4: Superando o Burnout Criativo',
    subtitle: 'Gestão ágil de time criativo em momentos de alta pressão',
    description: 'Uma análise detalhada sobre como o time de criação pivotou a estratégia após 3 semanas de estagnação...',
    fullContent: `
      <p>Durante o quarto trimestre, a equipe de marketing e criação enfrentou um bloqueio severo de entregas devido à sobrecarga de demandas simultâneas.</p>
      <h4>Diagnóstico e Mudança de Rota</h4>
      <p>Em vez de manter sprints tradicionais de 2 semanas, adotamos ciclos diários de sincronização (standups de 10 minutos) e matriz de priorização ICE (Impacto, Confiança e Facilidade).</p>
      <h4>Resultados Obtidos</h4>
      <p>Houve uma redução de 40% no retrabalho e entrega da campanha 4 dias antes do prazo estipulado com engajamento recorde de 28% superior ao Q3.</p>
    `,
    author: 'Marcos Lima',
    date: '12 Out 2023',
    category: 'Marketing',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
  },
  {
    id: 2,
    title: 'Migração de Servidores: Minimizando o Downtime Crítico',
    subtitle: 'Estratégia de migração zero-downtime com proxy reverso',
    description: 'Protocolos estabelecidos durante a transição de infraestrutura que garantiram 99.9% de disponibilidade.',
    fullContent: `
      <p>A migração dos bancos de dados relacionais e clusters de aplicação para a nova infraestrutura em nuvem exigia planejamento milimétrico.</p>
      <h4>Estratégia de Canary e Blue-Green</h4>
      <p>Implementamos balanceadores de carga com tráfego gradual e sincronização contínua com CDC (Change Data Capture) para evitar perda de dados transacionais.</p>
      <h4>Aprendizados Principais</h4>
      <p>Documentamos todos os passos no Guia de Contingência de Infraestrutura e reduzimos a janela de manutenção crítica para apenas 8 minutos.</p>
    `,
    author: 'Carla Mendes',
    date: '05 Out 2023',
    category: 'Tecnologia & DevOps',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
  },
]

const initialCommonErrors: CommonErrorItem[] = [
  {
    id: 1,
    title: 'Falha de Sincronização CMS',
    description: 'Ocorre quando o cache do servidor excede 5GB.',
    type: 'error',
    category: 'Infraestrutura',
    severity: 'Crítico',
    solution: 'Limpeza forçada do cache de arquivos temporários e purga na CDN.',
    stepsToFix: [
      'Acesse o servidor de aplicação via SSH ou painel administrativo.',
      'Execute o comando de expurgo do cache: "npm run cache:clear" ou acesse /admin/cache/flush.',
      'Verifique se o volume de disco liberou ao menos 20% do espaço.',
      'Reinicie os workers de sincronização em segundo plano.'
    ],
    source: 'Sistema'
  },
  {
    id: 2,
    title: 'Erro de Formatação PDF',
    description: 'Imagens em CMYK podem quebrar a exportação.',
    type: 'warning',
    category: 'Design & Mídia',
    severity: 'Aviso',
    solution: 'Converter perfis de cores das imagens para sRGB antes do upload.',
    stepsToFix: [
      'Abra a imagem no Photoshop, GIMP ou ferramenta de compressão.',
      'Altere o modo de cores de CMYK para RGB (sRGB IEC61966-2.1).',
      'Exporte em formato PNG ou WebP com 72 ou 144 DPI.',
      'Faça novo upload e gere a prévia do PDF.'
    ],
    source: 'Sistema'
  },
  {
    id: 3,
    title: 'Timeout na API de Tradução',
    description: 'Latência alta detectada nos servidores da AWS.',
    type: 'error',
    category: 'Integrações',
    severity: 'Crítico',
    solution: 'Habilitar retry com exponential backoff e fallback local.',
    stepsToFix: [
      'Aumente o timeout da requisição HTTP de 3s para 8s no arquivo de configuração.',
      'Ative a política de repetição com recuo exponencial (até 3 tentativas).',
      'Defina o cache em memória (Redis) para traduções de termos comuns.'
    ],
    source: 'Sistema'
  },
  {
    id: 4,
    title: 'Latência de Webhooks em Pagamentos',
    description: 'Falha de comunicação entre sandbox e módulo de logística legado.',
    type: 'error',
    category: 'Integrações',
    severity: 'Crítico',
    solution: 'Fila assíncrona (RabbitMQ/SQS) desacoplando o recebimento de webhooks do processamento síncrono.',
    stepsToFix: [
      'Receba o webhook e responda com HTTP 200 imediatamente após validar a assinatura.',
      'Publique a mensagem do evento na fila de eventos da aplicação.',
      'Consuma a fila com workers dedicados para persistência no banco legado.'
    ],
    source: 'Fórum',
    relatedForumId: 1
  }
]

const initialForumQuestions: ForumQuestion[] = [
  {
    id: 1,
    title: 'Como integrar a nova API de pagamentos com o módulo de logística Legado?',
    description: 'Estamos tendo problemas de latência nos webhooks do sandbox e eventuais timeouts ao tentar disparar a atualização de estoque no sistema legado.',
    author: '@rodrigo',
    time: 'há 2 horas',
    votes: 24,
    answers: 2,
    views: 145,
    tag: 'Integrações',
    hasBestAnswer: true,
    isKnownError: true,
    comments: [
      {
        id: 'c1',
        author: 'Marcos Lima',
        time: 'há 1 hora',
        content: 'Para resolver isso sem travar a resposta para o gateway, você deve responder HTTP 200 no webhook de imediato e jogar a requisição para uma fila de processamento assíncrono (RabbitMQ ou Redis). Isso desacopla o sistema legado da API externa.',
        votes: 18,
        isSolution: true
      },
      {
        id: 'c2',
        author: 'Carla Mendes',
        time: 'há 40 minutos',
        content: 'Excelente colocação do Marcos. Além disso, configure um mecanismo de retry com tempo exponencial de até 3 tentativas caso o banco legado esteja bloqueado por rotinas batch.',
        votes: 6,
        isSolution: false
      }
    ]
  },
  {
    id: 2,
    title: 'Qual o prazo real para aprovação de férias via portal NextStep?',
    description: 'O prazo oficial é de 5 dias úteis, mas se houver urgência com passagens já emitidas, qual o canal direto para alinhamento com RH e liderança?',
    author: '@jessica',
    time: 'há 1 dia',
    votes: 56,
    answers: 1,
    views: 203,
    tag: 'Recursos Humanos',
    hasBestAnswer: true,
    isKnownError: false,
    comments: [
      {
        id: 'c3',
        author: 'Ana Silva',
        time: 'há 20 horas',
        content: 'O prazo padrão é de 5 dias úteis, mas você pode marcar a tag "Urgência" no formulário e notificar o canal #rh-plantao no Slack com o número da solicitação para aprovação em até 24 horas.',
        votes: 32,
        isSolution: true
      }
    ]
  },
  {
    id: 3,
    title: 'Erro recorrente de build no pipeline de CI/CD: cache de dependências corrompido',
    description: 'O deploy no ambiente de staging falhou com "integrity checksum failed". Parece que o cache do runner no GitHub Actions ficou desatualizado após a última atualização de pacotes.',
    author: '@felipe_dev',
    time: 'há 3 horas',
    votes: 15,
    answers: 1,
    views: 92,
    tag: 'Tecnologia & DevOps',
    hasBestAnswer: true,
    isKnownError: true,
    comments: [
      {
        id: 'c4',
        author: 'Carla Mendes',
        time: 'há 2 horas',
        content: 'Basta invalidar a chave do cache no workflow alterando a string "cache-v1" para "cache-v2" no .github/workflows/deploy.yml ou limpando os caches via API do GitHub Actions.',
        votes: 12,
        isSolution: true
      }
    ]
  }
]

export default function KnowledgeBase() {
  const { user, token } = useAuth()

  // State for Forum, Known Errors, and Case Studies (persisted in RDS MySQL via API)
  const [forumQuestions, setForumQuestions] = useState<ForumQuestion[]>(initialForumQuestions)
  const [votedQuestionIds, setVotedQuestionIds] = useState<Set<string | number>>(new Set())
  const [commonErrors, setCommonErrors] = useState<CommonErrorItem[]>(initialCommonErrors)
  const [caseStudiesList, setCaseStudiesList] = useState<CaseStudy[]>(initialCaseStudies)
  const [coverFullscreenUrl, setCoverFullscreenUrl] = useState<string | null>(null)

  const fetchKnowledgeData = useCallback(async () => {
    try {
      const [questionsRes, errorsRes, casesRes] = await Promise.all([
        forumApi.getQuestions(token || undefined),
        forumApi.getKnownErrors(token || undefined),
        caseStudiesApi.getAll(token || undefined),
      ])

      if (questionsRes && questionsRes.length > 0) {
        setForumQuestions(questionsRes)
        const votedIds = new Set<string | number>()
        questionsRes.forEach((q) => {
          if (q.userVoted) votedIds.add(q.id)
        })
        setVotedQuestionIds(votedIds)
      }

      if (errorsRes && errorsRes.length > 0) {
        setCommonErrors(errorsRes)
      }

      if (casesRes !== null && casesRes !== undefined) {
        const approvedCases = casesRes.filter((c) => c.status === undefined || c.status === 1)
        const mappedCases: CaseStudy[] = approvedCases.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle || 'Conteúdo documentado',
          description: c.description.replace(/<[^>]+>/g, '').slice(0, 140) + '...',
          fullContent: c.description,
          author: c.authorName || 'Colaborador',
          date: new Date(c.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          category: c.categoryName || 'Tecnologia & DevOps',
          type: c.type === 1 ? 'Artigo' : c.type === 2 ? 'Erro Comum' : 'Estudo de Caso',
          image: c.imageUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop',
        }))
        setCaseStudiesList(mappedCases)
      }
    } catch (err) {
      console.error('Erro ao carregar base de conhecimento do banco de dados:', err)
    }
  }, [token])

  useEffect(() => {
    fetchKnowledgeData()
  }, [fetchKnowledgeData])

  // Modals
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null)
  const [selectedError, setSelectedError] = useState<CommonErrorItem | null>(null)
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null)
  const [showAllCasesModal, setShowAllCasesModal] = useState(false)
  const [showAllErrorsModal, setShowAllErrorsModal] = useState(false)
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false)
  const [showNewErrorModal, setShowNewErrorModal] = useState(false)

  // Filters for Collaborative Base (Case Studies, Articles, Common Errors)
  const [kbSearch, setKbSearch] = useState('')
  const [kbCategoryFilter, setKbCategoryFilter] = useState('Todas')
  const [kbTypeFilter, setKbTypeFilter] = useState<'Todos' | 'Estudo de Caso' | 'Artigo' | 'Erro Comum'>('Todos')
  const [kbPage, setKbPage] = useState(1)
  const KB_PER_PAGE = 30
  const [showKbBestPracticesModal, setShowKbBestPracticesModal] = useState(false)
  const [showKbAddCategoryModal, setShowKbAddCategoryModal] = useState(false)
  const [newKbCategoryName, setNewKbCategoryName] = useState('')
  const [, setKbVoteTick] = useState(0)
  const isAdmin = user?.role === 'Admin'

  // Filters for Forum
  const [forumCriterion, setForumCriterion] = useState<'Todos' | 'Erros Conhecidos' | 'Resolvidos' | 'Abertos' | 'Mais Votados'>('Todos')
  const [forumTagFilter, setForumTagFilter] = useState('Todas')
  const [forumSearch, setForumSearch] = useState('')

  // Filters for Known Errors
  const [errorFilterType, setErrorFilterType] = useState<'Todos' | 'Críticos' | 'Avisos' | 'Fórum'>('Todos')
  const [errorSearch, setErrorSearch] = useState('')

  // New Question Form
  const [newQTitle, setNewQTitle] = useState('')
  const [newQDescription, setNewQDescription] = useState('')
  const [newQTag, setNewQTag] = useState('Integrações')
  const [newQIsError, setNewQIsError] = useState(false)

  // New Comment Form
  const [commentText, setCommentText] = useState('')
  const [markAsSolution, setMarkAsSolution] = useState(false)

  // New Error Form
  const [newErrorTitle, setNewErrorTitle] = useState('')
  const [newErrorDesc, setNewErrorDesc] = useState('')
  const [newErrorType, setNewErrorType] = useState<'error' | 'warning'>('error')
  const [newErrorCat, setNewErrorCat] = useState('Tecnologia & DevOps')
  const [newErrorSolution, setNewErrorSolution] = useState('')

  // Vote handler (persisted in DB)
  const handleVoteQuestion = async (e: React.MouseEvent, questionId: number | string) => {
    e.stopPropagation()
    try {
      const res = await forumApi.toggleVote(questionId, token || undefined)
      const updatedQuestion = res.question

      setVotedQuestionIds((prev) => {
        const next = new Set(prev)
        if (res.userVoted) {
          next.add(questionId)
        } else {
          next.delete(questionId)
        }
        return next
      })

      setForumQuestions((prev) =>
        prev.map((q) => (String(q.id) === String(questionId) ? updatedQuestion : q))
      )

      if (selectedQuestion && String(selectedQuestion.id) === String(questionId)) {
        setSelectedQuestion(updatedQuestion)
      }
    } catch (err) {
      console.error('Erro ao registrar voto no banco de dados:', err)
    }
  }

  // View handler (increments views in DB when opening question)
  const handleOpenQuestion = async (question: ForumQuestion) => {
    setSelectedQuestion({ ...question, views: question.views + 1 })
    try {
      const updatedQuestion = await forumApi.incrementView(question.id, token || undefined)
      setForumQuestions((prev) =>
        prev.map((q) => (String(q.id) === String(question.id) ? updatedQuestion : q))
      )
      setSelectedQuestion(updatedQuestion)
    } catch (err) {
      console.error('Erro ao registrar visualização no banco de dados:', err)
    }
  }

  // Submit new forum question (persisted in DB)
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQTitle.trim() || !newQDescription.trim()) return

    try {
      const authorHandle = user?.fullName
        ? `@${user.fullName.toLowerCase().replace(/\s+/g, '_')}`
        : '@usuario'

      const createdQuestion = await forumApi.createQuestion(
        {
          title: newQTitle.trim(),
          description: newQDescription.trim(),
          tag: newQTag,
          author: authorHandle,
          isKnownError: newQIsError,
        },
        token || undefined
      )

      setForumQuestions((prev) => [createdQuestion, ...prev])
      if (createdQuestion.userVoted) {
        setVotedQuestionIds((prev) => new Set(prev).add(createdQuestion.id))
      }

      if (newQIsError) {
        const updatedErrors = await forumApi.getKnownErrors(token || undefined)
        setCommonErrors(updatedErrors)
      }

      setShowNewQuestionModal(false)
      setNewQTitle('')
      setNewQDescription('')
      setNewQIsError(false)
    } catch (err) {
      console.error('Erro ao criar pergunta no fórum:', err)
    }
  }

  // Submit comment to selected question (persisted in DB)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuestion || !commentText.trim()) return

    try {
      const updatedQuestion = await forumApi.addComment(
        selectedQuestion.id,
        {
          content: commentText.trim(),
          author: user?.fullName || 'Colaborador',
          isSolution: markAsSolution,
        },
        token || undefined
      )

      setSelectedQuestion(updatedQuestion)
      setForumQuestions((prev) =>
        prev.map((q) => (String(q.id) === String(selectedQuestion.id) ? updatedQuestion : q))
      )

      if (markAsSolution && selectedQuestion.isKnownError) {
        const updatedErrors = await forumApi.getKnownErrors(token || undefined)
        setCommonErrors(updatedErrors)
      }

      setCommentText('')
      setMarkAsSolution(false)
    } catch (err) {
      console.error('Erro ao adicionar comentário no banco de dados:', err)
    }
  }

  // Toggle comment solution (persisted in DB)
  const handleToggleCommentSolution = async (commentId: string | number) => {
    if (!selectedQuestion) return

    try {
      const updatedQuestion = await forumApi.toggleCommentSolution(
        selectedQuestion.id,
        commentId,
        token || undefined
      )

      setSelectedQuestion(updatedQuestion)
      setForumQuestions((prev) =>
        prev.map((q) => (String(q.id) === String(selectedQuestion.id) ? updatedQuestion : q))
      )

      if (updatedQuestion.isKnownError) {
        const updatedErrors = await forumApi.getKnownErrors(token || undefined)
        setCommonErrors(updatedErrors)
      }
    } catch (err) {
      console.error('Erro ao atualizar solução no banco de dados:', err)
    }
  }

  const handleVoteComment = async (commentId: string | number) => {
    if (!selectedQuestion) return
    try {
      const updatedQuestion = await forumApi.voteComment(
        selectedQuestion.id,
        commentId,
        token || undefined
      )
      setSelectedQuestion(updatedQuestion)
      setForumQuestions((prev) =>
        prev.map((q) => (String(q.id) === String(selectedQuestion.id) ? updatedQuestion : q))
      )
    } catch (err) {
      console.error('Erro ao votar no comentário:', err)
    }
  }

  const handleDeleteComment = async (commentId: string | number) => {
    if (!selectedQuestion) return
    if (!confirm('Deseja excluir esta resposta do fórum?')) return
    try {
      const updatedQuestion = await forumApi.deleteComment(
        selectedQuestion.id,
        commentId,
        token || undefined
      )
      setSelectedQuestion(updatedQuestion)
      setForumQuestions((prev) =>
        prev.map((q) => (String(q.id) === String(selectedQuestion.id) ? updatedQuestion : q))
      )
    } catch (err) {
      console.error('Erro ao excluir comentário:', err)
    }
  }

  const handleDeleteQuestion = async (questionId: string | number) => {
    if (!confirm('Tem certeza que deseja excluir este tópico do Fórum?')) return
    try {
      await forumApi.deleteQuestion(questionId, token || undefined)
    } catch {
      // fallback local
    }
    setForumQuestions((prev) => prev.filter((q) => String(q.id) !== String(questionId)))
    if (selectedQuestion && String(selectedQuestion.id) === String(questionId)) {
      setSelectedQuestion(null)
    }
  }

  const handleDeleteKnownError = async (errorId: string | number) => {
    if (!confirm('Tem certeza que deseja excluir este Erro Conhecido?')) return
    try {
      await forumApi.deleteKnownError(errorId, token || undefined)
    } catch {
      // fallback local
    }
    setCommonErrors((prev) => prev.filter((e) => String(e.id) !== String(errorId)))
    if (selectedError && String(selectedError.id) === String(errorId)) {
      setSelectedError(null)
    }
  }

  // Toggle Known Error status for a forum question (persisted in DB)
  const handleToggleKnownErrorFlag = async (question: ForumQuestion) => {
    try {
      const updatedQuestion = await forumApi.toggleKnownError(question.id, token || undefined)

      setForumQuestions((prev) =>
        prev.map((q) => (String(q.id) === String(question.id) ? updatedQuestion : q))
      )
      if (selectedQuestion && String(selectedQuestion.id) === String(question.id)) {
        setSelectedQuestion(updatedQuestion)
      }

      const updatedErrors = await forumApi.getKnownErrors(token || undefined)
      setCommonErrors(updatedErrors)
    } catch (err) {
      console.error('Erro ao classificar erro conhecido no banco de dados:', err)
    }
  }

  // Add new known error directly (persisted in DB)
  const handleCreateError = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newErrorTitle.trim() || !newErrorDesc.trim() || !newErrorSolution.trim()) return

    try {
      const createdError = await forumApi.createKnownError(
        {
          title: newErrorTitle.trim(),
          description: newErrorDesc.trim(),
          type: newErrorType,
          category: newErrorCat,
          solution: newErrorSolution.trim(),
          source: 'Sistema',
          stepsToFix: [
            'Identificar a ocorrência e isolar a causa primária.',
            newErrorSolution.trim(),
            'Validar a estabilidade do serviço após aplicação.',
          ],
        },
        token || undefined
      )

      setCommonErrors((prev) => [createdError, ...prev])
      setShowNewErrorModal(false)
      setNewErrorTitle('')
      setNewErrorDesc('')
      setNewErrorSolution('')
    } catch (err) {
      console.error('Erro ao criar erro conhecido no banco de dados:', err)
    }
  }

  // Filtered Forum Questions
  const filteredForumQuestions = forumQuestions.filter((q) => {
    // Criterion filter
    if (forumCriterion === 'Erros Conhecidos' && !q.isKnownError) return false
    if (forumCriterion === 'Resolvidos' && !q.hasBestAnswer) return false
    if (forumCriterion === 'Abertos' && q.hasBestAnswer) return false

    // Tag filter
    if (forumTagFilter !== 'Todas' && q.tag !== forumTagFilter) return false

    // Search filter
    if (forumSearch) {
      const query = forumSearch.toLowerCase()
      const matchTitle = q.title.toLowerCase().includes(query)
      const matchDesc = q.description.toLowerCase().includes(query)
      const matchAuthor = q.author.toLowerCase().includes(query)
      const matchTag = q.tag.toLowerCase().includes(query)
      if (!matchTitle && !matchDesc && !matchAuthor && !matchTag) return false
    }

    return true
  }).sort((a, b) => {
    if (forumCriterion === 'Mais Votados') {
      return b.votes - a.votes
    }
    return 0 // Keep default order
  })

  // Filtered Common Errors
  const filteredCommonErrors = commonErrors.filter((err) => {
    if (errorFilterType === 'Críticos' && err.type !== 'error') return false
    if (errorFilterType === 'Avisos' && err.type !== 'warning') return false
    if (errorFilterType === 'Fórum' && err.source !== 'Fórum') return false

    if (errorSearch) {
      const q = errorSearch.toLowerCase()
      return (
        err.title.toLowerCase().includes(q) ||
        err.description.toLowerCase().includes(q) ||
        err.category.toLowerCase().includes(q)
      )
    }
    return true
  })

  const [availableTags, setAvailableTags] = useState<string[]>([
    'Todas',
    'Integrações',
    'Recursos Humanos',
    'Tecnologia & DevOps',
    'Marketing',
    'Infraestrutura',
    'Editorial',
  ])

  const filteredKbItems = caseStudiesList.filter((item) => {
    const itemType = item.type || 'Estudo de Caso'
    if (kbTypeFilter !== 'Todos' && itemType !== kbTypeFilter) return false
    if (kbCategoryFilter !== 'Todas' && item.category !== kbCategoryFilter) return false
    if (kbSearch.trim()) {
      const q = kbSearch.toLowerCase()
      const match =
        item.title.toLowerCase().includes(q) ||
        (item.subtitle || '').toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.fullContent || '').toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  })

  const totalKbPages = Math.max(1, Math.ceil(filteredKbItems.length / KB_PER_PAGE))
  const paginatedKbItems = filteredKbItems.slice((kbPage - 1) * KB_PER_PAGE, kbPage * KB_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Central de Inteligência</p>
          <h1 className="text-3xl font-bold text-slate-900">Base de Conhecimento Colaborativa</h1>
          <p className="text-slate-600 mt-1">
            Explore Estudos de Caso, Artigos e Erros Comuns, consulte soluções e publique conhecimentos da equipe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={() => setShowKbBestPracticesModal(true)}>
            📖 Boas Práticas
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowKbAddCategoryModal(true)}>
              + Adicionar Categoria
            </Button>
          )}
          <Link to="/submit-case">
            <Button className="shadow-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Novo
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Collaborative Knowledge Base: Case Studies, Articles & Common Errors */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Estudos de Caso, Artigos & Erros Comuns</h3>
                  <p className="text-xs text-slate-500">
                    Exibindo {paginatedKbItems.length} de {filteredKbItems.length} publicações (até {KB_PER_PAGE} por página)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/submit-case">
                  <Button variant="outline" size="sm" className="text-xs">
                    + Adicionar Novo
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => setShowAllCasesModal(true)}>
                  Catálogo ({caseStudiesList.length})
                </Button>
              </div>
            </div>

            {/* Search + Category & Type Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
              <input
                type="text"
                value={kbSearch}
                onChange={(e) => {
                  setKbSearch(e.target.value)
                  setKbPage(1)
                }}
                placeholder="Buscar palavras em estudos de caso, artigos ou erros..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <select
                value={kbTypeFilter}
                onChange={(e) => {
                  setKbTypeFilter(e.target.value as typeof kbTypeFilter)
                  setKbPage(1)
                }}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Todos">Todos os Tipos</option>
                <option value="Estudo de Caso">Estudo de Caso</option>
                <option value="Artigo">Artigo</option>
                <option value="Erro Comum">Erro Comum</option>
              </select>
              <select
                value={kbCategoryFilter}
                onChange={(e) => {
                  setKbCategoryFilter(e.target.value)
                  setKbPage(1)
                }}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {availableTags.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Todas' ? 'Todas as Categorias' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedKbItems.map((study) => {
                const vote = getItemVote(`kb_${study.id}`)
                return (
                  <div
                    key={study.id}
                    onClick={() => setSelectedCaseStudy(study)}
                    className="group cursor-pointer border border-slate-100 p-3 rounded-xl hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-video bg-slate-100 rounded-lg mb-3 overflow-hidden relative group/img">
                        <img
                          src={study.image}
                          alt={study.title}
                          onClick={(e) => {
                            e.stopPropagation()
                            setCoverFullscreenUrl(study.image)
                          }}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300 cursor-zoom-in"
                          title="Clique para ver a capa em tela cheia"
                        />
                        <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {study.type || 'Estudo de Caso'}
                        </span>
                      </div>
                      <Badge variant="info" className="mb-2">{study.category}</Badge>
                      <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {study.title}
                      </h4>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">{study.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                      <p className="text-xs text-slate-500">Por: {study.author} • {study.date}</p>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            toggleItemVote(`kb_${study.id}`, 'like')
                            setKbVoteTick((t) => t + 1)
                          }}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            vote.userVote === 'like'
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50'
                          }`}
                        >
                          👍 {vote.likes}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            toggleItemVote(`kb_${study.id}`, 'dislike')
                            setKbVoteTick((t) => t + 1)
                          }}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            vote.userVote === 'dislike'
                              ? 'bg-red-100 border-red-300 text-red-800'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-red-50'
                          }`}
                        >
                          👎 {vote.dislikes}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalKbPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Página {kbPage} de {totalKbPages}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={kbPage <= 1} onClick={() => setKbPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={kbPage >= totalKbPages}
                    onClick={() => setKbPage((p) => p + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Forum */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">Fórum de Dúvidas & Incidentes</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {filteredForumQuestions.length}
                  </span>
                </div>
                <p className="text-sm text-slate-500">Colaboração em tempo real e documentação de soluções técnicas.</p>
              </div>
              <Button onClick={() => setShowNewQuestionModal(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Fazer uma Pergunta
              </Button>
            </div>

            {/* Filter by criteria (Requirement: "vai ser necessário filrar por algum critério") */}
            <div className="space-y-3 mb-5 border-y border-slate-100 py-3">
              {/* Criterion tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'Todos', label: 'Todos os Tópicos' },
                  { id: 'Erros Conhecidos', label: '🚨 Erros Conhecidos' },
                  { id: 'Resolvidos', label: '✅ Resolvidos (Com Solução)' },
                  { id: 'Abertos', label: '❓ Em Aberto' },
                  { id: 'Mais Votados', label: '🔥 Mais Votados' }
                ].map((crit) => (
                  <button
                    key={crit.id}
                    onClick={() => setForumCriterion(crit.id as typeof forumCriterion)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      forumCriterion === crit.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {crit.label}
                  </button>
                ))}
              </div>

              {/* Search & Tag row */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Filtrar perguntas, soluções ou palavras-chave..."
                    value={forumSearch}
                    onChange={(e) => setForumSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs text-slate-400 whitespace-nowrap">Categoria:</span>
                  <select
                    value={forumTagFilter}
                    onChange={(e) => setForumTagFilter(e.target.value)}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    {availableTags.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {(forumCriterion !== 'Todos' || forumTagFilter !== 'Todas' || forumSearch) && (
                    <button
                      onClick={() => {
                        setForumCriterion('Todos')
                        setForumTagFilter('Todas')
                        setForumSearch('')
                      }}
                      className="text-xs text-blue-600 hover:underline px-2 py-1 whitespace-nowrap"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredForumQuestions.map((question) => {
                const userVoted = votedQuestionIds.has(question.id)
                return (
                  <div
                    key={question.id}
                    onClick={() => handleOpenQuestion(question)}
                    className="flex gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100/90 border border-transparent hover:border-blue-200 transition-all cursor-pointer group"
                  >
                    {/* Votes column */}
                    <div className="flex flex-col items-center justify-center min-w-[50px] p-1">
                      <button
                        title={userVoted ? 'Remover voto' : 'Votar nesta dúvida'}
                        onClick={(e) => handleVoteQuestion(e, question.id)}
                        className={`p-2 rounded-lg transition-all ${
                          userVoted
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:bg-slate-200 hover:text-blue-600'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className={`text-sm font-bold mt-1 ${userVoted ? 'text-blue-600 font-extrabold' : 'text-slate-900'}`}>
                        {question.votes}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">votos</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge variant="info">{question.tag}</Badge>
                        {question.isKnownError && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            🚨 Erro Conhecido
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          Perguntado por <strong className="text-slate-700">{question.author}</strong> • {question.time}
                        </span>
                      </div>

                      <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {question.title}
                      </h4>
                      <TopicMediaPreview content={question.description} clampLines={2} className="mb-3" />

                      <div className="flex items-center gap-5 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {question.answers} {question.answers === 1 ? 'Resposta' : 'Respostas'}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {question.views} Visualizações
                        </span>
                        {question.hasBestAnswer && (
                          <span className="flex items-center gap-1 text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded">
                            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Solução Aprovada
                          </span>
                        )}
                      </div>

                      {question.hasBestAnswer && question.comments.find((c) => c.isSolution) && (
                        <div className="mt-3 p-3 bg-green-50/80 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-800 font-semibold flex items-center gap-1">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Resposta Selecionada / Solução:
                          </p>
                          <p className="text-xs text-green-700 mt-1 line-clamp-2">
                            {question.comments.find((c) => c.isSolution)?.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {filteredForumQuestions.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500">
                  <p className="font-semibold text-slate-700">Nenhum tópico encontrado com esses critérios.</p>
                  <p className="text-xs mt-1">Tente ajustar a busca ou selecione outra categoria.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column - 1/3 width (Erros Conhecidos) */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Resolução Rápida</p>
              <button
                onClick={() => setShowNewErrorModal(true)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                + Novo Erro
              </button>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Erros Conhecidos</h3>

            {/* Error filter tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg gap-1 mb-3 text-xs">
              {(['Todos', 'Críticos', 'Avisos', 'Fórum'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setErrorFilterType(mode)}
                  className={`flex-1 py-1 rounded-md font-medium transition-all ${
                    errorFilterType === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Error Search */}
            <div className="relative mb-3">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Pesquisar incidentes conhecidos..."
                value={errorSearch}
                onChange={(e) => setErrorSearch(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Error List */}
            <div className="space-y-3">
              {filteredCommonErrors.slice(0, 4).map((error) => (
                <div
                  key={error.id}
                  className={`p-3 rounded-lg border-l-4 transition-all ${
                    error.type === 'error' ? 'bg-red-50/80 border-red-500' : 'bg-yellow-50/80 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <svg className={`w-5 h-5 mt-0.5 shrink-0 ${error.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">{error.title}</p>
                        {error.source === 'Fórum' && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">Fórum</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{error.description}</p>
                      <button
                        onClick={() => setSelectedError(error)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline mt-1.5 flex items-center gap-1"
                      >
                        Ver Solução e Passos
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCommonErrors.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">Nenhum erro encontrado com os filtros atuais.</p>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full mt-4 text-xs font-semibold"
              onClick={() => setShowAllErrorsModal(true)}
            >
              Ver Todos os Erros ({commonErrors.length})
            </Button>
          </Card>
        </div>
      </div>

      {/* MODAL 1: Forum Question Detail & Comments & Solution Marking */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="info">{selectedQuestion.tag}</Badge>
                  {selectedQuestion.isKnownError && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                      🚨 Erro Conhecido Documentado
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    Publicado por <strong>{selectedQuestion.author}</strong> {selectedQuestion.time}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-snug">{selectedQuestion.title}</h2>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question Text */}
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-800 leading-relaxed border border-slate-100">
                <DescriptionRenderer content={selectedQuestion.description} />
              </div>

              {/* Action Bar (Votes, Views, Classify as Known Error) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <button
                    onClick={(e) => handleVoteQuestion(e, selectedQuestion.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                      votedQuestionIds.has(selectedQuestion.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                    </svg>
                    {selectedQuestion.votes} Votos
                  </button>
                  <span className="flex items-center gap-1 font-medium">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {selectedQuestion.views} visualizações
                  </span>
                </div>

                {/* Mark as Known Error & Delete buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleKnownErrorFlag(selectedQuestion)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                      selectedQuestion.isKnownError
                        ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {selectedQuestion.isKnownError ? 'Classificado como Erro Conhecido' : 'Classificar como Erro Conhecido'}
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                    title="Excluir Tópico"
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>

              {/* Answers and Comments Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    Respostas & Soluções ({selectedQuestion.comments.length})
                  </h4>
                  {selectedQuestion.hasBestAnswer && (
                    <span className="text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-0.5 rounded-full">
                      ✓ Solução Validada
                    </span>
                  )}
                </div>

                {selectedQuestion.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-xl border transition-all ${
                      comment.isSolution
                        ? 'bg-green-50/80 border-green-300 shadow-sm'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {comment.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{comment.author}</span>
                        <span className="text-xs text-slate-400">• {comment.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVoteComment(comment.id)}
                          className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold transition-colors"
                          title="Curtir resposta"
                        >
                          👍 {comment.votes || 0}
                        </button>
                        {comment.isSolution && (
                          <span className="px-2 py-0.5 bg-green-200 text-green-800 text-[11px] font-bold rounded-full">
                            ★ Solução Selecionada
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleCommentSolution(comment.id)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            comment.isSolution
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-700 hover:bg-green-100 font-medium'
                          }`}
                        >
                          {comment.isSolution ? 'Desmarcar Solução' : 'Marcar como Solução'}
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          title="Excluir resposta"
                          className="text-xs text-slate-400 hover:text-red-600 p-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="pl-9">
                      <DescriptionRenderer content={comment.content} />
                    </div>
                  </div>
                ))}

                {selectedQuestion.comments.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Ainda não há respostas para esta pergunta. Seja o primeiro a ajudar!
                  </p>
                )}
              </div>

              {/* Form: Add Comment */}
              <form onSubmit={handleAddComment} className="border-t border-slate-100 pt-4 space-y-3">
                <DescriptionField
                  label="Adicionar Resposta Técnica"
                  placeholder="Escreva orientações detalhadas, comandos, resoluções testadas... Cole prints (Ctrl+V) ou insira imagens."
                  value={commentText}
                  onChange={setCommentText}
                  rows={3}
                  required
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markAsSolution}
                      onChange={(e) => setMarkAsSolution(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Marcar esta resposta como a Solução Recomendada</span>
                  </label>
                  <Button type="submit" size="sm">
                    Publicar Resposta
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create New Forum Question */}
      {showNewQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">Fazer uma Pergunta no Fórum</h3>
              <button onClick={() => setShowNewQuestionModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título da Dúvida ou Incidente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Como configurar webhook de pagamentos em produção?"
                  value={newQTitle}
                  onChange={(e) => setNewQTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria / Tag *</label>
                <select
                  value={newQTag}
                  onChange={(e) => setNewQTag(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Integrações">Integrações</option>
                  <option value="Tecnologia & DevOps">Tecnologia & DevOps</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Infraestrutura">Infraestrutura</option>
                  <option value="Editorial">Editorial</option>
                </select>
              </div>

              <DescriptionField
                label="Descrição e Detalhes"
                required
                rows={4}
                placeholder="Explique o contexto, passos para reproduzir, mensagens de erro e o que já foi tentado... Você pode colar prints de tela (Ctrl+V) ou inserir imagens."
                value={newQDescription}
                onChange={setNewQDescription}
              />

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newQIsError}
                    onChange={(e) => setNewQIsError(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-red-900 block">Classificar como Erro Conhecido / Incidente</span>
                    <span className="text-[11px] text-red-700 block">
                      Este tópico será automaticamente listado na central de Erros Conhecidos para que outros colaboradores encontrem a solução rapidamente.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowNewQuestionModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Publicar Tópico</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Known Error Solution View */}
      {selectedError && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    selectedError.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedError.severity}
                  </span>
                  <Badge variant="info">{selectedError.category}</Badge>
                  {selectedError.source === 'Fórum' && (
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Origem: Fórum
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{selectedError.title}</h3>
              </div>
              <button onClick={() => setSelectedError(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100">
              <strong className="block mb-1 text-slate-800">Sintoma:</strong>
              <DescriptionRenderer content={selectedError.description} />
            </div>

            <div className="p-4 bg-green-50/80 border border-green-200 rounded-xl space-y-2">
              <h5 className="font-bold text-sm text-green-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Solução Recomendada
              </h5>
              <div className="text-xs text-green-900 leading-relaxed font-medium">
                <DescriptionRenderer content={selectedError.solution} />
              </div>
            </div>

            {selectedError.stepsToFix && selectedError.stepsToFix.length > 0 && (
              <div className="space-y-1.5">
                <h6 className="text-xs font-bold text-slate-900">Passos de Resolução:</h6>
                <ol className="space-y-1.5">
                  {selectedError.stepsToFix.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded">
                      <span className="font-bold text-blue-600">{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3">
                {selectedError.relatedForumId && (
                  <button
                    onClick={() => {
                      const q = forumQuestions.find((fq) => fq.id === selectedError.relatedForumId)
                      if (q) {
                        setSelectedError(null)
                        handleOpenQuestion(q)
                      }
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver Discussão no Fórum
                  </button>
                )}
                <button
                  onClick={() => handleDeleteKnownError(selectedError.id)}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  🗑️ Excluir Erro
                </button>
              </div>
              <Button onClick={() => setSelectedError(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: All Known Errors Catalog */}
      {showAllErrorsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Catálogo Geral de Erros Conhecidos</h3>
                <p className="text-xs text-slate-500">Mapeamento corporativo de incidentes e guias de resolução rápida</p>
              </div>
              <button onClick={() => setShowAllErrorsModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pesquisar entre todos os erros catalogados..."
                  value={errorSearch}
                  onChange={(e) => setErrorSearch(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <Button size="sm" onClick={() => {
                  setShowAllErrorsModal(false)
                  setShowNewErrorModal(true)
                }}>
                  + Novo Erro
                </Button>
              </div>

              <div className="space-y-3">
                {filteredCommonErrors.map((err) => (
                  <div key={err.id} className="p-4 border rounded-xl hover:border-blue-300 transition-all bg-slate-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          err.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {err.severity}
                        </span>
                        <Badge variant="info">{err.category}</Badge>
                        {err.source === 'Fórum' && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Fórum</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setShowAllErrorsModal(false)
                          setSelectedError(err)
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        Ver Solução Detalhada →
                      </button>
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm">{err.title}</h5>
                    <p className="text-xs text-slate-600 mt-0.5">{err.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Register New Known Error directly */}
      {showNewErrorModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">Cadastrar Erro Conhecido</h3>
              <button onClick={() => setShowNewErrorModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateError} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Erro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Falha de autenticação OAuth2 no portal legado"
                  value={newErrorTitle}
                  onChange={(e) => setNewErrorTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Severidade</label>
                  <select
                    value={newErrorType}
                    onChange={(e) => setNewErrorType(e.target.value as 'error' | 'warning')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="error">Crítico (Erro)</option>
                    <option value="warning">Moderado (Aviso)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={newErrorCat}
                    onChange={(e) => setNewErrorCat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Tecnologia & DevOps">Tecnologia & DevOps</option>
                    <option value="Integrações">Integrações</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Segurança">Segurança</option>
                  </select>
                </div>
              </div>

              <DescriptionField
                label="Descrição / Causa do Problema"
                required
                rows={2}
                placeholder="Explique sob quais circunstâncias o erro ocorre... Suporta inserção de imagens."
                value={newErrorDesc}
                onChange={setNewErrorDesc}
              />

              <DescriptionField
                label="Solução Homologada"
                required
                rows={3}
                placeholder="Instruções claras para contornar ou resolver o problema... Suporta inserção de imagens."
                value={newErrorSolution}
                onChange={setNewErrorSolution}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowNewErrorModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar no Catálogo</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Case Study Reader */}
      {selectedCaseStudy && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-slate-900">
              <img
                src={selectedCaseStudy.image}
                alt={selectedCaseStudy.title}
                onClick={() => setCoverFullscreenUrl(selectedCaseStudy.image)}
                className="w-full h-full object-cover opacity-90 cursor-zoom-in hover:opacity-100 transition-opacity"
                title="Clique para visualizar a imagem em tela cheia"
              />
              <button
                onClick={() => setSelectedCaseStudy(null)}
                className="absolute top-3 right-3 bg-black/60 text-white hover:bg-black/80 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="info">{selectedCaseStudy.category}</Badge>
                <span className="text-xs text-slate-500">
                  Por {selectedCaseStudy.author} • {selectedCaseStudy.date}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{selectedCaseStudy.title}</h2>
              {selectedCaseStudy.subtitle && (
                <p className="text-sm font-semibold text-blue-600">{selectedCaseStudy.subtitle}</p>
              )}
              <div className="pt-2 border-t border-slate-100">
                <DescriptionRenderer content={selectedCaseStudy.fullContent || selectedCaseStudy.description} />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Button onClick={() => setSelectedCaseStudy(null)}>Fechar Leitura</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: All Case Studies List */}
      {showAllCasesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Todos os Estudos de Caso</h3>
                <p className="text-xs text-slate-500">Histórico completo de casos documentados pela organização</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/submit-case" onClick={() => setShowAllCasesModal(false)}>
                  <Button size="sm">+ Submeter Estudo</Button>
                </Link>
                <button onClick={() => setShowAllCasesModal(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseStudiesList.map((study) => (
                <div
                  key={study.id}
                  onClick={() => {
                    setShowAllCasesModal(false)
                    setSelectedCaseStudy(study)
                  }}
                  className="border border-slate-200 rounded-xl p-3 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                >
                  <img
                    src={study.image}
                    alt={study.title}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCoverFullscreenUrl(study.image)
                    }}
                    className="w-full aspect-video object-cover rounded-lg mb-2 cursor-zoom-in hover:opacity-95 transition-opacity"
                    title="Clique para ver a capa em tela cheia"
                  />
                  <Badge variant="info" className="mb-1">{study.category}</Badge>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{study.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">{study.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Boas Práticas da Base de Conhecimento */}
      {showKbBestPracticesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                📖 Boas Práticas — Base de Conhecimento Colaborativa
              </h3>
              <button onClick={() => setShowKbBestPracticesModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Para garantir a padronização na plataforma, siga as diretrizes que diferenciam cada formato:
            </p>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-900 text-sm">📊 Estudo de Caso</h4>
                <p className="mt-1">Documenta uma situação real vivenciada pelo time, decisões tomadas e resultados medidos.</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h4 className="font-bold text-emerald-900 text-sm">📄 Artigo Técnico</h4>
                <p className="mt-1">Guia conceitual, tutorial técnico, boas práticas de arquitetura ou padrão operacional.</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-bold text-amber-900 text-sm">⚠️ Erro Comum</h4>
                <p className="mt-1">Descreve o sintoma exato da falha, causa raiz identificada e passo a passo de resolução.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowKbBestPracticesModal(false)}>
                Entendi
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Adicionar Categoria na Base de Conhecimento (Admin) */}
      {showKbAddCategoryModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Adicionar Categoria na Base</h3>
              <button onClick={() => setShowKbAddCategoryModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newKbCategoryName.trim()) return
                try {
                  await categoriesApi.create({ name: newKbCategoryName.trim() }, token || undefined)
                } catch {
                  // fallback
                }
                setAvailableTags((prev) => Array.from(new Set([...prev, newKbCategoryName.trim()])))
                setNewKbCategoryName('')
                setShowKbAddCategoryModal(false)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={newKbCategoryName}
                  onChange={(e) => setNewKbCategoryName(e.target.value)}
                  placeholder="Ex.: DevOps, Segurança, Dados..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowKbAddCategoryModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Categoria</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal para Visualização em Tela Cheia de Capas e Imagens */}
      <ImageFullscreenModal
        url={coverFullscreenUrl}
        onClose={() => setCoverFullscreenUrl(null)}
      />
    </div>
  )
}
