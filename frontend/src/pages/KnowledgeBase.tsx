import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'

export interface CaseStudy {
  id: number | string
  title: string
  subtitle?: string
  description: string
  fullContent?: string
  author: string
  date: string
  category: string
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
  const { user } = useAuth()

  // State for Forum
  const [forumQuestions, setForumQuestions] = useState<ForumQuestion[]>(() => {
    const saved = localStorage.getItem('nextstep_forum_questions')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return initialForumQuestions
      }
    }
    return initialForumQuestions
  })

  // State for user votes
  const [votedQuestionIds, setVotedQuestionIds] = useState<Set<string | number>>(() => {
    const saved = localStorage.getItem('nextstep_user_voted_questions')
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch {
        return new Set()
      }
    }
    return new Set()
  })

  // State for Common Errors
  const [commonErrors, setCommonErrors] = useState<CommonErrorItem[]>(() => {
    const saved = localStorage.getItem('nextstep_common_errors')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return initialCommonErrors
      }
    }
    return initialCommonErrors
  })

  // State for Case Studies
  const [caseStudiesList] = useState<CaseStudy[]>(() => {
    const saved = localStorage.getItem('nextstep_case_studies')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return initialCaseStudies
      }
    }
    return initialCaseStudies
  })

  // Modals
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null)
  const [selectedError, setSelectedError] = useState<CommonErrorItem | null>(null)
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null)
  const [showAllCasesModal, setShowAllCasesModal] = useState(false)
  const [showAllErrorsModal, setShowAllErrorsModal] = useState(false)
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false)
  const [showNewErrorModal, setShowNewErrorModal] = useState(false)

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

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('nextstep_forum_questions', JSON.stringify(forumQuestions))
  }, [forumQuestions])

  useEffect(() => {
    localStorage.setItem('nextstep_common_errors', JSON.stringify(commonErrors))
  }, [commonErrors])

  useEffect(() => {
    localStorage.setItem(
      'nextstep_user_voted_questions',
      JSON.stringify(Array.from(votedQuestionIds))
    )
  }, [votedQuestionIds])

  // Vote handler
  const handleVoteQuestion = (e: React.MouseEvent, questionId: number | string) => {
    e.stopPropagation()
    const hasVoted = votedQuestionIds.has(questionId)
    const newVoted = new Set(votedQuestionIds)

    if (hasVoted) {
      newVoted.delete(questionId)
    } else {
      newVoted.add(questionId)
    }
    setVotedQuestionIds(newVoted)

    setForumQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const updatedVotes = hasVoted ? q.votes - 1 : q.votes + 1
          return { ...q, votes: updatedVotes }
        }
        return q
      })
    )

    if (selectedQuestion && selectedQuestion.id === questionId) {
      setSelectedQuestion((prev) =>
        prev
          ? {
              ...prev,
              votes: hasVoted ? prev.votes - 1 : prev.votes + 1,
            }
          : null
      )
    }
  }

  // View handler (increments views when opening question)
  const handleOpenQuestion = (question: ForumQuestion) => {
    const updatedViews = question.views + 1
    const updatedQuestion = { ...question, views: updatedViews }

    setForumQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? updatedQuestion : q))
    )
    setSelectedQuestion(updatedQuestion)
  }

  // Submit new forum question
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQTitle.trim() || !newQDescription.trim()) return

    const newQuestion: ForumQuestion = {
      id: Date.now(),
      title: newQTitle.trim(),
      description: newQDescription.trim(),
      author: user?.fullName ? `@${user.fullName.toLowerCase().replace(/\s+/g, '_')}` : '@usuario',
      time: 'Agora mesmo',
      votes: 1,
      answers: 0,
      views: 1,
      tag: newQTag,
      hasBestAnswer: false,
      isKnownError: newQIsError,
      comments: []
    }

    setForumQuestions([newQuestion, ...forumQuestions])

    // If marked as known error, also add a entry in common errors
    if (newQIsError) {
      const autoError: CommonErrorItem = {
        id: Date.now() + 1,
        title: newQTitle.trim(),
        description: newQDescription.trim(),
        type: 'error',
        category: newQTag,
        severity: 'Crítico',
        solution: 'Em investigação colaborativa no Fórum de Dúvidas. Acompanhe as respostas técnicas enviadas pela equipe.',
        stepsToFix: [
          'Verifique as respostas recentes na discussão do Fórum.',
          'Valide se o comportamento pode ser reproduzido em ambiente de testes.',
          'Contribua com logs adicionais no tópico correspondente.'
        ],
        source: 'Fórum',
        relatedForumId: newQuestion.id
      }
      setCommonErrors([autoError, ...commonErrors])
    }

    setShowNewQuestionModal(false)
    setNewQTitle('')
    setNewQDescription('')
    setNewQIsError(false)
  }

  // Submit comment to selected question
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuestion || !commentText.trim()) return

    const newComment: ForumComment = {
      id: 'c_' + Date.now(),
      author: user?.fullName || 'Você',
      time: 'Agora mesmo',
      content: commentText.trim(),
      votes: 0,
      isSolution: markAsSolution
    }

    const updatedComments = [...selectedQuestion.comments, newComment]
    const updatedHasBestAnswer = selectedQuestion.hasBestAnswer || markAsSolution
    const updatedAnswersCount = selectedQuestion.answers + 1

    const updatedQuestion: ForumQuestion = {
      ...selectedQuestion,
      comments: updatedComments,
      answers: updatedAnswersCount,
      hasBestAnswer: updatedHasBestAnswer,
    }

    setSelectedQuestion(updatedQuestion)
    setForumQuestions((prev) =>
      prev.map((q) => (q.id === selectedQuestion.id ? updatedQuestion : q))
    )

    // If marked as solution and question is a known error, update common errors
    if (markAsSolution && selectedQuestion.isKnownError) {
      const errorIndex = commonErrors.findIndex(
        (err) => err.relatedForumId === selectedQuestion.id || err.title === selectedQuestion.title
      )
      if (errorIndex !== -1) {
        const updatedErrors = [...commonErrors]
        updatedErrors[errorIndex] = {
          ...updatedErrors[errorIndex],
          solution: newComment.content,
        }
        setCommonErrors(updatedErrors)
      }
    }

    setCommentText('')
    setMarkAsSolution(false)
  }

  // Toggle comment solution
  const handleToggleCommentSolution = (commentId: string | number) => {
    if (!selectedQuestion) return

    const updatedComments = selectedQuestion.comments.map((c) => {
      if (c.id === commentId) {
        return { ...c, isSolution: !c.isSolution }
      }
      return c
    })

    const hasAnySolution = updatedComments.some((c) => c.isSolution)
    const updatedQuestion: ForumQuestion = {
      ...selectedQuestion,
      comments: updatedComments,
      hasBestAnswer: hasAnySolution,
    }

    setSelectedQuestion(updatedQuestion)
    setForumQuestions((prev) =>
      prev.map((q) => (q.id === selectedQuestion.id ? updatedQuestion : q))
    )
  }

  // Toggle Known Error status for a forum question
  const handleToggleKnownErrorFlag = (question: ForumQuestion) => {
    const newStatus = !question.isKnownError
    const updatedQuestion = { ...question, isKnownError: newStatus }

    setForumQuestions((prev) =>
      prev.map((q) => (q.id === question.id ? updatedQuestion : q))
    )
    if (selectedQuestion?.id === question.id) {
      setSelectedQuestion(updatedQuestion)
    }

    if (newStatus) {
      // Add to common errors if not already present
      const alreadyExists = commonErrors.some(
        (err) => err.relatedForumId === question.id || err.title === question.title
      )
      if (!alreadyExists) {
        const solutionComment = question.comments.find((c) => c.isSolution)
        const newError: CommonErrorItem = {
          id: Date.now(),
          title: question.title,
          description: question.description,
          type: 'error',
          category: question.tag,
          severity: 'Crítico',
          solution: solutionComment
            ? solutionComment.content
            : 'Solução em debate no Fórum de Dúvidas.',
          source: 'Fórum',
          relatedForumId: question.id,
          stepsToFix: [
            'Acesse a discussão técnica completa no Fórum.',
            'Consulte as orientações e respostas validadas pelos especialistas.'
          ]
        }
        setCommonErrors([newError, ...commonErrors])
      }
    }
  }

  // Add new known error directly
  const handleCreateError = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newErrorTitle.trim() || !newErrorDesc.trim() || !newErrorSolution.trim()) return

    const item: CommonErrorItem = {
      id: Date.now(),
      title: newErrorTitle.trim(),
      description: newErrorDesc.trim(),
      type: newErrorType,
      category: newErrorCat,
      severity: newErrorType === 'error' ? 'Crítico' : 'Aviso',
      solution: newErrorSolution.trim(),
      source: 'Sistema',
      stepsToFix: [
        'Identificar a ocorrência e isolar a causa primária.',
        newErrorSolution.trim(),
        'Validar a estabilidade do serviço após aplicação.'
      ]
    }

    setCommonErrors([item, ...commonErrors])
    setShowNewErrorModal(false)
    setNewErrorTitle('')
    setNewErrorDesc('')
    setNewErrorSolution('')
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

  const availableTags = ['Todas', 'Integrações', 'Recursos Humanos', 'Tecnologia & DevOps', 'Marketing', 'Infraestrutura', 'Editorial']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Central de Inteligência</p>
          <h1 className="text-3xl font-bold text-slate-900">Base de Conhecimento Colaborativa</h1>
          <p className="text-slate-600 mt-1">
            Explore aprendizados, documente experiências, consulte erros conhecidos e resolva incidentes em equipe.
          </p>
        </div>
        <Link to="/submit-case">
          <Button className="shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submeter Estudo de Caso
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Studies */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Estudos de Caso</h3>
                  <p className="text-xs text-slate-500">Histórias reais de resolução e aprendizados práticos da equipe</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/submit-case">
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
                    + Submeter Estudo
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => setShowAllCasesModal(true)}>
                  Ver todos ({caseStudiesList.length})
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseStudiesList.slice(0, 2).map((study) => (
                <div
                  key={study.id}
                  onClick={() => setSelectedCaseStudy(study)}
                  className="group cursor-pointer border border-slate-100 p-3 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="aspect-video bg-slate-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={study.image}
                      alt={study.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <Badge variant="info" className="mb-2">{study.category}</Badge>
                  <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {study.title}
                  </h4>
                  <p className="text-sm text-slate-600 mb-2 line-clamp-2">{study.description}</p>
                  <p className="text-xs text-slate-500">Por: {study.author} • {study.date}</p>
                </div>
              ))}
            </div>
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
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                        {question.description}
                      </p>

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
                {selectedQuestion.description}
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

                {/* Mark as Known Error button */}
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
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pl-9">
                      {comment.content}
                    </p>
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
                <label className="block text-sm font-bold text-slate-900">Adicionar Resposta Técnica</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escreva orientações detalhadas, comandos ou resoluções testadas..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição e Detalhes *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explique o contexto, passos para reproduzir, mensagens de erro e o que já foi tentado..."
                  value={newQDescription}
                  onChange={(e) => setNewQDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

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
              <strong>Sintoma:</strong> {selectedError.description}
            </div>

            <div className="p-4 bg-green-50/80 border border-green-200 rounded-xl space-y-2">
              <h5 className="font-bold text-sm text-green-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Solução Recomendada
              </h5>
              <p className="text-xs text-green-800 leading-relaxed font-medium">
                {selectedError.solution}
              </p>
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
              {selectedError.relatedForumId ? (
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
              ) : <div />}
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Causa do Problema *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explique sob quais circunstâncias o erro ocorre..."
                  value={newErrorDesc}
                  onChange={(e) => setNewErrorDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Solução Homologada *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Instruções claras para contornar ou resolver o problema..."
                  value={newErrorSolution}
                  onChange={(e) => setNewErrorSolution(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

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
                className="w-full h-full object-cover opacity-90"
              />
              <button
                onClick={() => setSelectedCaseStudy(null)}
                className="absolute top-3 right-3 bg-black/60 text-white hover:bg-black/80 p-2 rounded-full"
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
              <div
                className="prose prose-sm max-w-none text-slate-700 leading-relaxed pt-2 border-t border-slate-100"
                dangerouslySetInnerHTML={{
                  __html: selectedCaseStudy.fullContent || `<p>${selectedCaseStudy.description}</p>`
                }}
              />
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
                    className="w-full aspect-video object-cover rounded-lg mb-2"
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
    </div>
  )
}
