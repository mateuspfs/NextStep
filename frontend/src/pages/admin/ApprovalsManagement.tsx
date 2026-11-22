import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { processesApi, caseStudiesApi, usersApi, statsApi, ProcessDto, Content, User } from '../../services/api'
import { getNexPRedemptions, saveNexPRedemptions, NexPRedemption } from '../../utils/nexpStore'
import { showToast } from '../../utils/toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import DescriptionRenderer from '../../components/ui/DescriptionRenderer'

interface UnifiedRequestItem {
  id: string
  requestType: 'Processo' | 'Recompensa NexP'
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
  // User info
  userId?: string
  userName: string
  userPhoto?: string
  userPoints: number
  // Process payload
  processTitle?: string
  processSubtitle?: string
  processDescription?: string
  processCategory?: string
  // Product payload
  productTitle?: string
  productDescription?: string
  productImageUrl?: string
  productCost?: number
}

export default function ApprovalsManagement() {
  const { token } = useAuth()

  const [pendingProcesses, setPendingProcesses] = useState<ProcessDto[]>([])
  const [allProcesses, setAllProcesses] = useState<ProcessDto[]>([])
  const [allContents, setAllContents] = useState<Content[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [redemptions, setRedemptions] = useState<NexPRedemption[]>(() => getNexPRedemptions())
  const [loading, setLoading] = useState(true)

  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Processo' | 'Recompensa NexP'>('Todos')
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [selectedItem, setSelectedItem] = useState<UnifiedRequestItem | null>(null)
  const [expandedRequestDetail, setExpandedRequestDetail] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [pendProcRes, allProcRes, contRes, usersRes] = await Promise.allSettled([
        processesApi.getPending(token || undefined),
        processesApi.getAll(token || undefined),
        caseStudiesApi.getAdminAll(token || undefined),
        usersApi.getAll(token || undefined),
      ])

      if (pendProcRes.status === 'fulfilled' && pendProcRes.value) {
        setPendingProcesses(pendProcRes.value)
      }
      if (allProcRes.status === 'fulfilled' && allProcRes.value) {
        setAllProcesses(allProcRes.value)
      }
      if (contRes.status === 'fulfilled' && contRes.value) {
        setAllContents(contRes.value)
      }
      if (usersRes.status === 'fulfilled' && usersRes.value) {
        setAllUsers(usersRes.value)
      }
      setRedemptions(getNexPRedemptions())
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Build unified requests list (Processes + NexP Redemptions), ordered from oldest to newest
  const unifiedList: UnifiedRequestItem[] = [
    ...pendingProcesses.map((p): UnifiedRequestItem => ({
      id: p.id,
      requestType: 'Processo',
      status: 'Pending',
      createdAt: p.createdAt || new Date().toISOString(),
      userId: p.authorId,
      userName: p.author || 'Colaborador',
      userPhoto: p.authorPhoto,
      userPoints: p.authorPoints ?? 250,
      processTitle: p.title,
      processSubtitle: p.subtitle,
      processDescription: p.description,
      processCategory: p.category,
    })),
    ...allProcesses
      .filter((p) => !pendingProcesses.some((pp) => pp.id === p.id))
      .map((p): UnifiedRequestItem => ({
        id: p.id,
        requestType: 'Processo',
        status: p.rawStatus === 'Rejected' ? 'Rejected' : 'Approved',
        createdAt: p.createdAt || new Date().toISOString(),
        userId: p.authorId,
        userName: p.author || 'Colaborador',
        userPhoto: p.authorPhoto,
        userPoints: p.authorPoints ?? 450,
        processTitle: p.title,
        processSubtitle: p.subtitle,
        processDescription: p.description,
        processCategory: p.category,
      })),
    ...redemptions.map((r): UnifiedRequestItem => ({
      id: r.id,
      requestType: 'Recompensa NexP',
      status: r.status,
      createdAt: r.createdAt,
      userId: r.userId,
      userName: r.userName,
      userPhoto: r.userPhoto,
      userPoints: r.userPoints,
      productTitle: r.productTitle,
      productDescription: r.productDescription,
      productImageUrl: r.productImageUrl,
      productCost: r.cost,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const filteredItems = unifiedList.filter((item) => {
    if (typeFilter !== 'Todos' && item.requestType !== typeFilter) return false
    if (statusFilter !== 'All' && item.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const target = `${item.userName} ${item.processTitle || ''} ${item.productTitle || ''} ${item.processCategory || ''}`.toLowerCase()
      if (!target.includes(q)) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE))
  const paginatedItems = filteredItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Compute user publication & activity metrics for the modal header
  const getUserMetrics = (item: UnifiedRequestItem) => {
    const matchedUser = allUsers.find(
      (u) => u.id === item.userId || u.fullName.toLowerCase() === item.userName.toLowerCase()
    )
    const userContents = allContents.filter(
      (c) => c.authorId === matchedUser?.id || c.authorName?.toLowerCase() === item.userName.toLowerCase()
    )
    const articlesCount = userContents.filter((c) => c.type === 1).length
    const caseStudiesCount = userContents.filter((c) => c.type === 0 || c.type === undefined).length
    const processesCount =
      allProcesses.filter((p) => p.author?.toLowerCase() === item.userName.toLowerCase()).length +
      pendingProcesses.filter((p) => p.author?.toLowerCase() === item.userName.toLowerCase()).length
    const points = matchedUser?.nexPoints ?? item.userPoints ?? 0
    const answeredActivities = Math.max(2, Math.floor(points / 80))

    return {
      photo: matchedUser?.photoUrl || item.userPhoto,
      points,
      answeredActivities,
      articlesCount,
      caseStudiesCount,
      processesCount,
    }
  }

  const handleApproveItem = async (item: UnifiedRequestItem) => {
    setIsProcessing(true)
    try {
      if (item.requestType === 'Processo') {
        await processesApi.approve(item.id, token || undefined)
        if (item.userId) {
          await statsApi.addXp(item.userId, 50, token || undefined).catch(() => {})
        }
      } else {
        const updated = redemptions.map((r) =>
          r.id === item.id ? { ...r, status: 'Approved' as const } : r
        )
        saveNexPRedemptions(updated)
        setRedemptions(updated)
        if (item.userId && item.productCost) {
          await statsApi.addXp(item.userId, -Math.abs(item.productCost), token || undefined).catch(() => {})
        }
      }
      setSelectedItem(null)
      showToast('Solicitação aprovada com sucesso!', {
        type: 'success',
        subtitle: item.requestType === 'Processo' ? item.processTitle : item.productTitle,
      })
      await loadAllData()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectItem = async (item: UnifiedRequestItem) => {
    setIsProcessing(true)
    try {
      if (item.requestType === 'Processo') {
        await processesApi.reject(item.id, token || undefined)
      } else {
        const updated = redemptions.map((r) =>
          r.id === item.id ? { ...r, status: 'Rejected' as const } : r
        )
        saveNexPRedemptions(updated)
        setRedemptions(updated)
      }
      setSelectedItem(null)
      showToast('Solicitação aprovada com sucesso!', {
        type: 'success',
        subtitle: item.requestType === 'Processo' ? item.processTitle : item.productTitle,
      })
      await loadAllData()
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Carregando Painel de Solicitações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Administração</p>
          <h1 className="text-3xl font-bold text-slate-900">Painel de Solicitações</h1>
          <p className="text-slate-600 mt-1">
            Homologue processos submetidos pelos colaboradores e aprove resgates de recompensas NexP (ordenados do mais antigo para o mais recente).
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Buscar por nome do colaborador, processo ou recompensa..."
          className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
        />

        <div className="flex flex-wrap items-center gap-2">
          {(['Todos', 'Processo', 'Recompensa NexP'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                typeFilter === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t === 'Todos' ? 'Todos os Tipos' : t === 'Processo' ? '📋 Processos' : '🎁 Recompensas NexP'}
            </button>
          ))}

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter)
              setPage(1)
            }}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white"
          >
            <option value="Pending">⏳ Pendentes</option>
            <option value="Approved">✅ Aprovados</option>
            <option value="Rejected">❌ Reprovados</option>
            <option value="All">Todos os Status</option>
          </select>
        </div>
      </Card>

      {/* Cards Grid (20 per page) */}
      {paginatedItems.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          Nenhuma solicitação encontrada para os filtros selecionados.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.map((item) => (
            <Card
              key={`${item.requestType}-${item.id}`}
              onClick={() => {
                setExpandedRequestDetail(true)
                setSelectedItem(item)
              }}
              className="p-5 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {item.userPhoto && item.userPhoto.startsWith('http') ? (
                    <img
                      src={item.userPhoto}
                      alt={item.userName}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-base">
                      {item.userName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.userName}</h4>
                    <span className="text-xs font-semibold text-amber-600">
                      ⚡ {item.userPoints} NexPoints atuais
                    </span>
                  </div>
                </div>
                <Badge variant={item.requestType === 'Processo' ? 'info' : 'warning'}>
                  {item.requestType}
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {item.requestType === 'Processo' ? item.processTitle : item.productTitle}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {item.requestType === 'Processo'
                    ? `${item.processCategory} • ${item.processSubtitle}`
                    : `Resgate de Produto • Custo: ${item.productCost} NexP`}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>📅 {new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                <Badge
                  variant={
                    item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'error' : 'warning'
                  }
                >
                  {item.status === 'Approved'
                    ? 'Aprovado'
                    : item.status === 'Rejected'
                    ? 'Reprovado'
                    : 'Pendente'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination (20 per page) */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <span className="text-xs text-slate-500">
          Exibindo {paginatedItems.length} de {filteredItems.length} solicitações (página {page} de {totalPages})
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Modal de Detalhes da Solicitação */}
      {selectedItem && (() => {
        const metrics = getUserMetrics(selectedItem)
        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
              {/* Top User Summary Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                  {metrics.photo && metrics.photo.startsWith('http') ? (
                    <img
                      src={metrics.photo}
                      alt={selectedItem.userName}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xl">
                      {selectedItem.userName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{selectedItem.userName}</h3>
                      <Badge variant={selectedItem.requestType === 'Processo' ? 'info' : 'warning'}>
                        {selectedItem.requestType}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">
                      ⚡ {metrics.points} NexPoints atuais
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg px-2"
                >
                  ✕
                </button>
              </div>

              {/* User Activity & Publication Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-lg font-extrabold text-slate-900">{metrics.answeredActivities}</p>
                  <p className="text-[11px] text-slate-500">Atividades Respondidas</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-lg font-extrabold text-slate-900">{metrics.articlesCount}</p>
                  <p className="text-[11px] text-slate-500">Artigos Publicados</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-lg font-extrabold text-slate-900">{metrics.caseStudiesCount}</p>
                  <p className="text-[11px] text-slate-500">Casos de Uso</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-lg font-extrabold text-slate-900">{metrics.processesCount}</p>
                  <p className="text-[11px] text-slate-500">Processos Publicados</p>
                </div>
              </div>

              {/* Request Content Below */}
              {selectedItem.requestType === 'Processo' ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedRequestDetail((e) => !e)}
                    className="w-full px-4 py-3 bg-slate-100 flex items-center justify-between text-left"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase text-blue-600">
                        Solicitação de Publicação de Processo
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{selectedItem.processTitle}</h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">
                      {expandedRequestDetail ? '▲ Recolher' : '▼ Expandir Processo'}
                    </span>
                  </button>

                  {expandedRequestDetail && (
                    <div className="p-4 space-y-3 bg-white">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          <strong>Subtítulo:</strong> {selectedItem.processSubtitle}
                        </span>
                        <Badge variant="info">{selectedItem.processCategory}</Badge>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <DescriptionRenderer content={selectedItem.processDescription || ''} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={selectedItem.productImageUrl}
                    alt={selectedItem.productTitle}
                    className="w-24 h-24 rounded-xl object-cover border border-amber-200 shrink-0"
                  />
                  <div className="space-y-1 flex-1">
                    <span className="text-xs font-bold uppercase text-amber-800">
                      Solicitação de Resgate de Produto NexP
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{selectedItem.productTitle}</h4>
                    <p className="text-xs text-slate-600">{selectedItem.productDescription}</p>
                    <p className="text-sm font-extrabold text-amber-700 pt-1">
                      Custo do Resgate: {selectedItem.productCost} NexPoints
                    </p>
                  </div>
                </div>
              )}

              {/* Approve / Reject Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  disabled={isProcessing}
                  onClick={() => handleRejectItem(selectedItem)}
                >
                  ❌ Reprovar Solicitação
                </Button>
                <Button disabled={isProcessing} onClick={() => handleApproveItem(selectedItem)}>
                  {isProcessing ? 'Processando...' : '✅ Aprovar Solicitação'}
                </Button>
              </div>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}
