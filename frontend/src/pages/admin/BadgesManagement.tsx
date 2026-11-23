import { useState, useEffect, useCallback } from 'react'
import {
  Award,
  Trophy,
  Crown,
  Flame,
  Zap,
  Lock,
  Plus,
  Pencil,
  Trash2,
  Play,
  Search,
  X,
  Image as ImageIcon,
  Code2,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useUser } from '../../contexts/UserContext'
import { badgesApi, Badge as BadgeType } from '../../services/api'
import { showToast, showConfirm } from '../../utils/toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import ImageUploadButton from '../../components/ui/ImageUploadButton'

const DEFAULT_BADGE_SQL = `SELECT u."Id"
FROM "Users" u
LEFT JOIN "UserStats" s ON s."UserId" = u."Id"
WHERE u."Role" = 0
  AND (u."NexPoints" >= @RequiredPoints OR COALESCE(s."TotalXp", 0) >= @RequiredPoints)
  AND NOT EXISTS (
      SELECT 1 FROM "UserBadges" ub
      WHERE ub."UserId" = u."Id" AND ub."BadgeId" = @BadgeId
  )`

const RARITY_STYLES: Record<
  number,
  { label: string; bg: string; pill: string; Icon: typeof Trophy }
> = {
  0: {
    label: 'Comum',
    bg: 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white',
    pill: 'bg-blue-100 text-blue-700 border-blue-200',
    Icon: Trophy,
  },
  1: {
    label: 'Raro',
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white',
    pill: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    Icon: Zap,
  },
  2: {
    label: 'Épico',
    bg: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white',
    pill: 'bg-purple-100 text-purple-700 border-purple-300',
    Icon: Flame,
  },
  3: {
    label: 'Lendário',
    bg: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white',
    pill: 'bg-amber-100 text-amber-800 border-amber-300',
    Icon: Crown,
  },
}

export function BadgeVisual({
  badge,
  unlocked = true,
  size = 'md',
}: {
  badge: { name: string; iconUrl?: string; rarity: number | string }
  unlocked?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const rarityNum = Number(badge.rarity) || 0
  const style = RARITY_STYLES[rarityNum] || RARITY_STYLES[0]
  const RarityIcon = style.Icon

  const dim =
    size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-14 h-14'
  const iconDim =
    size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-7 h-7'

  const hasCustomImage =
    Boolean(badge.iconUrl && badge.iconUrl.trim().length > 0) && !imgFailed

  if (!unlocked) {
    return (
      <div
        className={`${dim} rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0`}
      >
        <Lock className="w-5 h-5" />
      </div>
    )
  }

  if (hasCustomImage) {
    return (
      <div
        className={`${dim} rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm shrink-0 flex items-center justify-center`}
      >
        <img
          src={badge.iconUrl}
          alt={badge.name}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={`${dim} rounded-xl ${style.bg} flex items-center justify-center shadow-sm shrink-0`}
    >
      <RarityIcon className={iconDim} />
    </div>
  )
}

export default function BadgesManagement() {
  const { user, token } = useAuth()
  const { badges: userBadges, refreshBadges, showBadgeModal } = useUser()
  const isAdmin = user?.role === 'Admin'

  const [allBadges, setAllBadges] = useState<BadgeType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 12

  // Modal Create/Edit Badge
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null)
  const [badgeName, setBadgeName] = useState('')
  const [badgeDesc, setBadgeDesc] = useState('')
  const [badgePoints, setBadgePoints] = useState(250)
  const [badgeRarity, setBadgeRarity] = useState(0)
  const [badgeIconUrl, setBadgeIconUrl] = useState('')
  const [badgeCriteriaSql, setBadgeCriteriaSql] = useState(DEFAULT_BADGE_SQL)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunningWorker, setIsRunningWorker] = useState(false)

  const loadBadges = useCallback(async () => {
    setLoading(true)
    try {
      const data = await badgesApi.getAll(token || undefined)
      if (data) setAllBadges(data)
    } catch {
      showToast('Erro ao carregar emblemas', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadBadges()
  }, [loadBadges])

  const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub]))

  const filteredBadges = allBadges.filter((b) => {
    if (rarityFilter !== 'all' && String(b.rarity) !== rarityFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        (b.criteria || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / ITEMS_PER_PAGE))
  const paginatedBadges = filteredBadges.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const openCreateModal = () => {
    setEditingBadge(null)
    setBadgeName('')
    setBadgeDesc('')
    setBadgePoints(250)
    setBadgeRarity(0)
    setBadgeIconUrl('')
    setBadgeCriteriaSql(DEFAULT_BADGE_SQL)
    setShowFormModal(true)
  }

  const openEditModal = (b: BadgeType) => {
    setEditingBadge(b)
    setBadgeName(b.name)
    setBadgeDesc(b.description)
    setBadgePoints(b.requiredPoints)
    setBadgeRarity(Number(b.rarity) || 0)
    setBadgeIconUrl(b.iconUrl || '')
    setBadgeCriteriaSql(b.criteria && b.criteria.trim().length > 0 ? b.criteria : DEFAULT_BADGE_SQL)
    setShowFormModal(true)
  }

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!badgeName.trim()) return
    setIsSaving(true)
    try {
      const payload = {
        name: badgeName.trim(),
        description: badgeDesc.trim(),
        requiredPoints: Number(badgePoints) || 0,
        rarity: Number(badgeRarity) || 0,
        iconUrl: badgeIconUrl.trim(),
        criteria: badgeCriteriaSql.trim() || DEFAULT_BADGE_SQL,
      }

      if (editingBadge) {
        await badgesApi.update(editingBadge.id, payload, token || undefined)
        showToast('Emblema atualizado com sucesso!', {
          type: 'success',
          subtitle: badgeName.trim(),
        })
      } else {
        await badgesApi.create(payload, token || undefined)
        showToast('Novo emblema cadastrado!', {
          type: 'success',
          subtitle: `${badgeName.trim()} — O Worker avaliará automaticamente no próximo ciclo.`,
        })
      }
      await loadBadges()
      await refreshBadges()
      setShowFormModal(false)
    } catch (err) {
      showToast('Erro ao salvar emblema', {
        type: 'error',
        subtitle: err instanceof Error ? err.message : 'Verifique os campos preenchidos.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteBadge = async (b: BadgeType) => {
    const confirmed = await showConfirm({
      title: 'Excluir Emblema?',
      message: `Tem certeza que deseja excluir permanentemente o emblema "${b.name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, Excluir Emblema',
      cancelText: 'Cancelar',
      variant: 'danger',
    })
    if (!confirmed) return

    try {
      await badgesApi.delete(b.id, token || undefined)
      await loadBadges()
      showToast('Emblema excluído!', { type: 'info', subtitle: b.name })
    } catch {
      showToast('Erro ao excluir emblema', { type: 'error' })
    }
  }

  const handleRunWorkerNow = async () => {
    setIsRunningWorker(true)
    try {
      const res = await badgesApi.runWorkerNow(token || undefined)
      showToast(
        res.awardedCount > 0
          ? `Worker atribuiu ${res.awardedCount} novo(s) emblema(s)!`
          : 'Worker executado com sucesso!',
        {
          type: res.awardedCount > 0 ? 'success' : 'info',
          subtitle: res.message,
        }
      )
      await loadBadges()
    } catch {
      showToast('Erro ao executar Worker de Emblemas', { type: 'error' })
    } finally {
      setIsRunningWorker(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-0 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'Gestão de Emblemas & Worker SQL' : 'Catálogo de Conquistas NextStep'}</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isAdmin ? 'Listagem e Gestão de Emblemas' : 'Todos os Emblemas da Plataforma'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {isAdmin
                ? 'Cadastre emblemas com imagens personalizadas e queries SQL de relatório executadas automaticamente pelo Worker agendado em background.'
                : 'Confira todos os emblemas disponíveis, raridades e os critérios para desbloqueá-los automaticamente.'}
            </p>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                size="sm"
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10 flex items-center gap-1.5"
                disabled={isRunningWorker}
                onClick={handleRunWorkerNow}
              >
                <Play className="w-4 h-4" />
                <span>{isRunningWorker ? 'Executando Worker...' : 'Executar Worker Agora'}</span>
              </Button>
              <Button size="sm" className="flex items-center gap-1.5" onClick={openCreateModal}>
                <Plus className="w-4 h-4" />
                <span>Novo Emblema</span>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Search & Filters */}
      <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Pesquisar emblema por nome, descrição ou query SQL..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={rarityFilter}
            onChange={(e) => {
              setRarityFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="all">Todas Raridades ({allBadges.length})</option>
            <option value="0">Comum</option>
            <option value="1">Raro</option>
            <option value="2">Épico</option>
            <option value="3">Lendário</option>
          </select>
        </div>
      </Card>

      {/* Badges Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-56">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginatedBadges.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          Nenhum emblema encontrado com os filtros selecionados.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedBadges.map((b) => {
            const rarityStyle = RARITY_STYLES[Number(b.rarity) || 0] || RARITY_STYLES[0]
            const unlocked = isAdmin || earnedMap.has(b.id)
            const earned = earnedMap.get(b.id)

            return (
              <Card
                key={b.id}
                onClick={() => {
                  if (!isAdmin && earned) {
                    showBadgeModal(earned)
                  }
                }}
                className={`p-5 flex flex-col justify-between gap-4 transition-all ${
                  !isAdmin && earned
                    ? 'border-amber-200 bg-amber-50/30 hover:shadow-md cursor-pointer'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <BadgeVisual badge={b} unlocked={unlocked} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base truncate">{b.name}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rarityStyle.pill}`}
                          >
                            {rarityStyle.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{b.description}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(b)
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Emblema, Imagem e Query SQL"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBadge(b)
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir Emblema"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isAdmin && b.criteria && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <Code2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Query SQL do Relatório (Worker):</span>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {b.criteria}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <Badge variant="info">
                    {b.requiredPoints > 0 ? `Meta: ${b.requiredPoints} NexP` : 'Critério SQL Custom'}
                  </Badge>
                  {!isAdmin ? (
                    earned ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Conquistado em{' '}
                        {new Date(earned.earnedAt).toLocaleDateString('pt-BR')}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Bloqueado</span>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      {b.iconUrl && b.iconUrl.trim() ? 'Imagem customizada' : 'Ícone padrão'}
                    </span>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Página {page} de {totalPages} ({filteredBadges.length} emblemas)
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
      )}

      {/* Modal: Criar / Editar Emblema (Admin) */}
      {showFormModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBadge ? 'Editar Emblema & Query SQL' : 'Cadastrar Novo Emblema'}
                </h3>
                <p className="text-xs text-slate-500">
                  Faça upload de uma imagem exclusiva (ou deixe vazio para usar o ícone padrão) e cadastre a query SQL do Worker.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBadge} className="space-y-4">
              {/* Preview + Image Upload */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <BadgeVisual
                  badge={{ name: badgeName || 'Emblema', iconUrl: badgeIconUrl, rarity: badgeRarity }}
                  unlocked
                  size="lg"
                />
                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Imagem Personalizada do Emblema (opcional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <ImageUploadButton
                        onImageUploaded={(url) => setBadgeIconUrl(url)}
                        label="Subir Imagem"
                      />
                      {badgeIconUrl && (
                        <button
                          type="button"
                          onClick={() => setBadgeIconUrl('')}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Usar Padrão
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={badgeIconUrl}
                    onChange={(e) => setBadgeIconUrl(e.target.value)}
                    placeholder="Deixe vazio para usar o ícone padrão ou informe/envie uma imagem..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Emblema *</label>
                  <input
                    type="text"
                    required
                    value={badgeName}
                    onChange={(e) => setBadgeName(e.target.value)}
                    placeholder="Ex: Mestre 1000 NexPoints"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Meta (@RequiredPoints)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={badgePoints}
                    onChange={(e) => setBadgePoints(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Raridade</label>
                  <select
                    value={badgeRarity}
                    onChange={(e) => setBadgeRarity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={0}>Comum</option>
                    <option value={1}>Raro</option>
                    <option value={2}>Épico</option>
                    <option value={3}>Lendário</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Requisito *</label>
                <input
                  type="text"
                  required
                  value={badgeDesc}
                  onChange={(e) => setBadgeDesc(e.target.value)}
                  placeholder="Descrição exibida para o colaborador..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              {/* SQL Query Editor */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Query SQL do Relatório (Executada pelo Worker Agendado)
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setBadgeCriteriaSql(DEFAULT_BADGE_SQL)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                    >
                      NexPoints &gt;= @RequiredPoints
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBadgeCriteriaSql(`SELECT u."Id"
FROM "Users" u
INNER JOIN "UserStats" s ON s."UserId" = u."Id"
WHERE u."Role" = 0
  AND s."ActivitiesCompleted" >= 5
  AND NOT EXISTS (
      SELECT 1 FROM "UserBadges" ub
      WHERE ub."UserId" = u."Id" AND ub."BadgeId" = @BadgeId
  )`)
                      }
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 hover:bg-purple-200"
                    >
                      Quizzes &gt;= 5
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBadgeCriteriaSql(`SELECT u."Id"
FROM "Users" u
INNER JOIN "UserStats" s ON s."UserId" = u."Id"
WHERE u."Role" = 0
  AND s."CoursesCompleted" >= 3
  AND NOT EXISTS (
      SELECT 1 FROM "UserBadges" ub
      WHERE ub."UserId" = u."Id" AND ub."BadgeId" = @BadgeId
  )`)
                      }
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    >
                      Cursos &gt;= 3
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBadgeCriteriaSql(`SELECT u."Id"
FROM "Users" u
INNER JOIN "UserStats" s ON s."UserId" = u."Id"
WHERE u."Role" = 0
  AND (s."CurrentStreak" >= 7 OR s."LongestStreak" >= 7)
  AND NOT EXISTS (
      SELECT 1 FROM "UserBadges" ub
      WHERE ub."UserId" = u."Id" AND ub."BadgeId" = @BadgeId
  )`)
                      }
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 hover:bg-amber-200"
                    >
                      Ofensiva &gt;= 7 Dias
                    </button>
                  </div>
                </div>
                <textarea
                  rows={5}
                  required
                  value={badgeCriteriaSql}
                  onChange={(e) => setBadgeCriteriaSql(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-slate-900 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={() => setShowFormModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Emblema'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
