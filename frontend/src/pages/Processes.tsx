import { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  X,
  Tag,
  User,
  ClipboardList,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Check,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { processesApi, categoriesApi } from '../services/api'
import { getItemVote, toggleItemVote } from '../utils/nexpStore'
import { showToast, showConfirm } from '../utils/toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import DescriptionField from '../components/ui/DescriptionField'
import DescriptionRenderer from '../components/ui/DescriptionRenderer'
import TopicMediaPreview from '../components/ui/TopicMediaPreview'

export interface ProcessItem {
  id: number | string
  title: string
  subtitle: string
  description: string
  category: string
  author: string
  status: string
  steps?: string[]
}

const initialProcesses: ProcessItem[] = [
  {
    id: '1',
    title: 'Fluxo de Revisão Editorial',
    subtitle: 'Processo de revisão e aprovação de conteúdo editorial',
    description: 'Fluxo completo para revisão técnica, ortográfica e aprovação de conteúdos editoriais antes da publicação na plataforma.',
    category: 'Editorial',
    author: 'Ana Silva',
    status: 'Ativo',
    steps: [
      'Submissão do rascunho pelo autor',
      'Análise de conformidade e tom de voz editorial',
      'Validação técnica e revisão ortográfica',
      'Aprovação final e agendamento de publicação'
    ]
  },
  {
    id: '2',
    title: 'Pipeline de Recursos Visuais',
    subtitle: 'Pipeline de processamento e otimização de imagens',
    description: 'Processamento automatizado de imagens para compressão sem perda, geração de formatos modernos (WebP/AVIF) e padronização.',
    category: 'Técnico',
    author: 'Carlos Mendes',
    status: 'Ativo',
    steps: [
      'Upload dos ativos originais em alta resolução',
      'Validação de proporção e perfil de cor sRGB',
      'Compressão automatizada e geração de miniaturas',
      'Disponibilização na CDN'
    ]
  },
  {
    id: '3',
    title: 'Pagamento de Colaboradores',
    subtitle: 'Processo de homologação e repasse a prestadores',
    description: 'Fluxo seguro de conferência de entregas, validação fiscal e execução de repasses para contribuidores externos e especialistas.',
    category: 'Financeiro',
    author: 'Maria Santos',
    status: 'Ativo',
    steps: [
      'Recebimento e conferência da nota fiscal',
      'Validação da entrega pela gerência de área',
      'Agendamento bancário no sistema financeiro',
      'Envio do comprovante de liquidação'
    ]
  },
  {
    id: '4',
    title: 'Validação de Metadados e SEO',
    subtitle: 'Verificação de indexação e acessibilidade',
    description: 'Processo de conferência de palavras-chave, meta tags Open Graph, tags canônicas e textos alternativos para acessibilidade.',
    category: 'Técnico',
    author: 'Pedro Lima',
    status: 'Ativo',
    steps: [
      'Auditoria de tags title, description e heading hierarchy',
      'Verificação de imagens com atributo alt descritivo',
      'Teste de visualização em redes sociais (Open Graph)',
      'Validação de links canônicos e sitemap'
    ]
  },
  {
    id: '5',
    title: 'Resposta a Incidentes de Segurança e LGPD',
    subtitle: 'Protocolo imediato de contenção, diagnóstico e notificação',
    description: 'Procedimento operacional padrão para tratamento de incidentes de segurança da informação e proteção de dados pessoais.',
    category: 'Segurança',
    author: 'Luis Henrique',
    status: 'Ativo',
    steps: [
      'Isolamento imediato do serviço ou credencial afetada',
      'Abertura de sala de crise e coleta de logs de auditoria',
      'Aplicação de patch corretivo e rotação de chaves',
      'Documentação na Central de Erros Conhecidos e relatório de pós-incidente'
    ]
  },
]

const defaultCategories = ['Todos', 'Editorial', 'Técnico', 'Financeiro', 'Segurança']

const CHECKLIST_STORAGE_KEY = 'nextstep_process_checklists'

export default function Processes() {
  const { user, token } = useAuth()
  const { addXp } = useUser()

  const [categories, setCategories] = useState<string[]>(defaultCategories)
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [processesList, setProcessesList] = useState<ProcessItem[]>(initialProcesses)
  const [isLoading, setIsLoading] = useState(true)

  const [selectedProcess, setSelectedProcess] = useState<ProcessItem | null>(null)
  const [editingProcess, setEditingProcess] = useState<ProcessItem | null>(null)
  const [savedChecklists, setSavedChecklists] = useState<Record<string, number[]>>(() => {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
  const [checkedSteps, setCheckedSteps] = useState<number[]>([])
  const [processCompletedBanner, setProcessCompletedBanner] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showBestPracticesModal, setShowBestPracticesModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null)
  const [, setVotesTick] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const isAdmin = user?.role === 'Admin'

  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [newCategory, setNewCategory] = useState('Editorial')
  const [newDescription, setNewDescription] = useState('')
  const [newAuthor, setNewAuthor] = useState(user?.fullName || 'Colaborador Interno')
  const [newStepsText, setNewStepsText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user?.fullName) {
      setNewAuthor(user.fullName)
    }
  }, [user])

  useEffect(() => {
    let mounted = true
    async function loadData() {
      try {
        setIsLoading(true)
        const [procData, catData] = await Promise.allSettled([
          processesApi.getAll(token || undefined),
          categoriesApi.getAll(token || undefined),
        ])
        if (mounted && procData.status === 'fulfilled' && procData.value && procData.value.length > 0) {
          setProcessesList(procData.value)
        }
        if (mounted && catData.status === 'fulfilled' && catData.value && catData.value.length > 0) {
          const names = Array.from(new Set(['Todos', ...catData.value.map((c) => c.name), 'Financeiro']))
          setCategories(names)
        }
      } catch {
        // Fallback para dados locais caso offline
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    loadData()
    return () => {
      mounted = false
    }
  }, [token])

  const filteredProcesses = processesList.filter((process) => {
    const matchesCategory = selectedCategory === 'Todos' || process.category === selectedCategory
    const matchesSearch =
      process.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredProcesses.length / itemsPerPage))
  const paginatedProcesses = filteredProcesses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleOpenProcess = (process: ProcessItem) => {
    setSelectedProcess(process)
    const key = String(process.id)
    setCheckedSteps(savedChecklists[key] || [])
    setProcessCompletedBanner(false)
  }

  const handleToggleStep = (idx: number) => {
    setCheckedSteps((prev) => {
      const next = prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      if (selectedProcess) {
        const key = String(selectedProcess.id)
        const updatedMap = { ...savedChecklists, [key]: next }
        setSavedChecklists(updatedMap)
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(updatedMap))
      }
      return next
    })
  }

  const handleCompleteProcessChecklist = async () => {
    if (!selectedProcess) return
    setProcessCompletedBanner(true)
    await addXp(25)
  }

  const handleOpenEditProcess = (process: ProcessItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingProcess(process)
    setNewTitle(process.title)
    setNewSubtitle(process.subtitle)
    setNewCategory(process.category)
    setNewDescription(process.description)
    setNewAuthor(process.author)
    setNewStepsText((process.steps || []).join('\n'))
    setSelectedProcess(null)
    setShowAddModal(true)
  }

  const handleDeleteProcess = async (process: ProcessItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const ok = await showConfirm({
      title: 'Excluir Processo?',
      message: `Tem certeza que deseja excluir o processo "${process.title}" da Central de Processos?`,
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return
    try {
      await processesApi.delete(String(process.id), token || undefined)
    } catch {
      // fallback local removal
    }
    setProcessesList((prev) => prev.filter((p) => String(p.id) !== String(process.id)))
    if (selectedProcess && String(selectedProcess.id) === String(process.id)) {
      setSelectedProcess(null)
    }
    showToast('Processo excluído', { type: 'info', subtitle: process.title })
  }

  const handleAddProcess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDescription.trim()) return

    const parsedSteps = newStepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const defaultSteps =
      parsedSteps.length > 0
        ? parsedSteps
        : [
            'Etapa inicial de solicitação e triagem',
            'Processamento e execução operacional',
            'Revisão e homologação de qualidade'
          ]

    setIsSaving(true)
    try {
      const payload = {
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || 'Processo operacional documentado',
        description: newDescription.trim(),
        category: newCategory,
        author: newAuthor.trim() || user?.fullName || 'Equipe Interna',
        steps: defaultSteps,
      }

      if (editingProcess) {
        const updated = await processesApi.update(String(editingProcess.id), payload, token || undefined)
        setProcessesList((prev) =>
          prev.map((p) => (String(p.id) === String(editingProcess.id) ? updated : p))
        )
        showToast('Processo atualizado!', { type: 'success', subtitle: updated.title })
      } else {
        const created = await processesApi.create(payload, token || undefined)
        if (isAdmin) {
          setProcessesList((prev) => [created, ...prev])
          showToast('Processo publicado na Central!', { type: 'success', subtitle: created.title })
        } else {
          setSubmissionNotice(
            `✅ Solicitação do processo "${created.title}" enviada para aprovação do Administrador! Ela já consta no Painel de Solicitações.`
          )
          showToast('Solicitação de processo enviada!', {
            type: 'info',
            subtitle: 'Aguardando aprovação do Administrador.',
          })
          setTimeout(() => setSubmissionNotice(null), 7000)
        }
        await addXp(30)
      }
    } catch {
      const fallbackProcess: ProcessItem = {
        id: editingProcess ? editingProcess.id : String(Date.now()),
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || 'Processo operacional documentado',
        description: newDescription.trim(),
        category: newCategory,
        author: newAuthor.trim() || 'Equipe Interna',
        status: 'Ativo',
        steps: defaultSteps,
      }
      if (editingProcess) {
        setProcessesList((prev) =>
          prev.map((p) => (String(p.id) === String(editingProcess.id) ? fallbackProcess : p))
        )
      } else {
        setProcessesList((prev) => [fallbackProcess, ...prev])
      }
    } finally {
      setIsSaving(false)
      setShowAddModal(false)
      setEditingProcess(null)
      setNewTitle('')
      setNewSubtitle('')
      setNewDescription('')
      setNewStepsText('')
      setCurrentPage(1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Padronização de Fluxos</p>
          <h1 className="text-3xl font-bold text-slate-900">Central de Processos</h1>
          <p className="text-slate-600 mt-1">
            Consulte os procedimentos operacionais padrão, execute checklists guiados e documente novos fluxos corporativos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" onClick={() => setShowBestPracticesModal(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Boas Práticas
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowAddCategoryModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Adicionar Categoria
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingProcess(null)
              setNewTitle('')
              setNewSubtitle('')
              setNewDescription('')
              setNewStepsText('')
              setShowAddModal(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Processo
          </Button>
        </div>
      </div>

      {submissionNotice && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-semibold flex items-center justify-between shadow-sm">
          <span>{submissionNotice}</span>
          <button onClick={() => setSubmissionNotice(null)} className="text-amber-700 hover:text-amber-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar em processos, manuais ou fluxos operacionais..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Filtrar:</span>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category)
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
          {selectedCategory !== 'Todos' || searchQuery ? (
            <button
              onClick={() => {
                setSelectedCategory('Todos')
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="ml-2 text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          ) : null}
        </div>
      </div>

      {/* Process List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Carregando processos corporativos...</p>
          </Card>
        ) : (
          paginatedProcesses.map((process) => (
            <Card
              key={process.id}
              onClick={() => handleOpenProcess(process)}
              className="p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {process.title}
                    </h3>
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      {process.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-blue-600 mb-2">{process.subtitle}</p>
                  <TopicMediaPreview content={process.description} clampLines={2} className="mb-4" />
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Tag className="w-4 h-4 text-slate-400" />
                      {process.category}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      {process.author}
                    </span>
                    {process.steps && (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <ClipboardList className="w-4 h-4" />
                        {process.steps.length} etapas
                      </span>
                    )}
                    {/* Like & Dislike Buttons */}
                    <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const vote = getItemVote(`proc_${process.id}`)
                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                toggleItemVote(`proc_${process.id}`, 'like')
                                setVotesTick((t) => t + 1)
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border transition-colors ${
                                vote.userVote === 'like'
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50'
                              }`}
                              title="Útil (Like)"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" /> {vote.likes}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                toggleItemVote(`proc_${process.id}`, 'dislike')
                                setVotesTick((t) => t + 1)
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border transition-colors ${
                                vote.userVote === 'dislike'
                                  ? 'bg-red-100 border-red-300 text-red-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-red-50'
                              }`}
                              title="Deslike"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" /> {vote.dislikes}
                            </button>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))
        )}

        {!isLoading && filteredProcesses.length === 0 && (
          <Card className="p-12 text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-semibold text-slate-700">Nenhum processo encontrado</p>
            <p className="text-sm mt-1">Tente buscar por outro termo ou selecione outra categoria.</p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages >= 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Exibindo {paginatedProcesses.length} de {filteredProcesses.length} processos (até {itemsPerPage} por página)
          </span>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
          </div>
        </div>
      )}

      {/* Modal Adicionar Categoria (Admin) */}
      {showAddCategoryModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Nova Categoria de Processos</h3>
              <button onClick={() => setShowAddCategoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newCategoryName.trim()) return
                try {
                  await categoriesApi.create({ name: newCategoryName.trim() }, token || undefined)
                } catch {
                  // fallback
                }
                setCategories((prev) => Array.from(new Set([...prev, newCategoryName.trim()])))
                setNewCategory(newCategoryName.trim())
                setNewCategoryName('')
                setShowAddCategoryModal(false)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex.: Operações, Compliance, Comercial..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddCategoryModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Categoria</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Process Detail Modal with Interactive Checklist */}
      {selectedProcess && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">{selectedProcess.category}</Badge>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {selectedProcess.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedProcess.title}</h2>
                <p className="text-sm font-medium text-blue-600 mt-1">{selectedProcess.subtitle}</p>
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

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Descrição do Fluxo</h4>
              <DescriptionRenderer content={selectedProcess.description} />
            </div>

            {selectedProcess.steps && selectedProcess.steps.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Checklist Interativo de Execução ({checkedSteps.length}/{selectedProcess.steps.length})
                  </h4>
                  <span className="text-xs font-medium text-blue-600">+25 XP ao concluir</span>
                </div>
                <ol className="space-y-2">
                  {selectedProcess.steps.map((step, idx) => {
                    const isChecked = checkedSteps.includes(idx)
                    return (
                      <li
                        key={idx}
                        onClick={() => handleToggleStep(idx)}
                        className={`flex items-start gap-3 text-sm p-3 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-green-50 border-green-200 text-green-900'
                            : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-blue-200'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isChecked ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span className={isChecked ? 'line-through opacity-80' : ''}>{step}</span>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}

            {processCompletedBanner && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-800 text-sm">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Procedimento executado e validado com sucesso!
                </span>
                <span className="font-bold text-green-700">+25 XP creditados</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>Responsável: <strong>{selectedProcess.author}</strong></span>
              <span>Padrão Corporativo Homologado</span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEditProcess(selectedProcess)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar Processo
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProcess(selectedProcess)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
              <div className="flex items-center gap-2">
                {selectedProcess.steps &&
                  checkedSteps.length === selectedProcess.steps.length &&
                  !processCompletedBanner && (
                    <Button onClick={handleCompleteProcessChecklist}>
                      Concluir Execução (+25 XP)
                    </Button>
                  )}
                <Button variant="outline" onClick={() => setSelectedProcess(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Process Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingProcess ? 'Editar Processo Operacional' : 'Documentar Novo Processo'}
                </h3>
                <p className="text-xs text-blue-600 font-medium">
                  {editingProcess ? 'Atualize o procedimento homologado' : '+30 XP por contribuir com a padronização'}
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProcess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Processo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Auditoria de Segurança Trimestral"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo / Objetivo</label>
                <input
                  type="text"
                  placeholder="Ex: Revisão periódica de acessos e conformidade"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {categories
                      .filter((c) => c !== 'Todos')
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <DescriptionField
                label="Descrição Completa"
                required
                rows={4}
                placeholder="Descreva detalhadamente o fluxo operacional, critérios de entrada e saída... Cole imagens (Ctrl+V) ou insira imagens."
                value={newDescription}
                onChange={setNewDescription}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Etapas do Checklist (uma por linha)
                </label>
                <textarea
                  rows={3}
                  placeholder={'1. Conferir requisitos de entrada\n2. Executar validação técnica\n3. Homologar entrega'}
                  value={newStepsText}
                  onChange={(e) => setNewStepsText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Processo'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Best Practices Modal */}
      {showBestPracticesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Guia de Boas Práticas</h3>
              </div>
              <button onClick={() => setShowBestPracticesModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-1">1. Mapeamento Claro de Etapas</h5>
                <p className="text-blue-800 text-xs leading-relaxed">
                  Todo processo deve ter gatilhos de início bem delimitados, etapas sequenciais testadas e critérios objetivos de conclusão.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <h5 className="font-semibold text-slate-900 mb-1">2. Responsabilidade e Papéis (RACI)</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Defina claramente quem é o responsável pela execução, quem aprova e quem deve ser consultado ou informado em cada etapa.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <h5 className="font-semibold text-slate-900 mb-1">3. Documentação Viva</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Evite manuais estáticos. Atualize os procedimentos sempre que houver mudanças nas ferramentas ou na legislação (como LGPD).
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <h5 className="font-semibold text-slate-900 mb-1">4. Aprendizado com Erros Conhecidos</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Se um processo frequentemente gera dúvidas ou incidentes no Fórum, documente o caso na Central de Erros Conhecidos para resolução rápida.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowBestPracticesModal(false)}>Entendi</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
