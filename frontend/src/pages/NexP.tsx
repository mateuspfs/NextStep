import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ShoppingBag,
  HelpCircle,
  Target,
  CheckCircle2,
  Award,
  Trophy,
  Lock,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Crown,
  Clock,
  XCircle,
  X,
  Inbox,
  Gift,
  Settings,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { badgesApi, ranksApi, statsApi, Badge as BadgeType, LeaderboardEntry } from '../services/api'
import {
  NexPProduct,
  NexPRedemption,
  DailyMission,
  getNexPProducts,
  saveNexPProducts,
  getNexPRedemptions,
  saveNexPRedemptions,
  getDailyMissions,
  saveDailyMissions,
  getCompletedMissionsToday,
  markMissionCompletedToday,
} from '../utils/nexpStore'
import { showToast } from '../utils/toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ImageUploadButton from '../components/ui/ImageUploadButton'

export default function NexP() {
  const { user, token } = useAuth()
  const { stats, rank, badges: userBadges, addXp, refreshBadges, showBadgeModal } = useUser()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'Admin'

  // Garantir que o Admin permaneça dentro do Portal Admin (/admin/nexp)
  useEffect(() => {
    if (isAdmin && location.pathname === '/nexp') {
      navigate('/admin/nexp', { replace: true })
    }
  }, [isAdmin, location.pathname, navigate])

  // Products & Carousel
  const [products, setProducts] = useState<NexPProduct[]>(() => getNexPProducts())
  const [storeSearch, setStoreSearch] = useState('')
  const [storeCategory, setStoreCategory] = useState('Todas')
  const [carouselOffset, setCarouselOffset] = useState(0)

  // Product Admin Modal
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<NexPProduct | null>(null)
  const [prodTitle, setProdTitle] = useState('')
  const [prodDesc, setProdDesc] = useState('')
  const [prodCost, setProdCost] = useState(500)
  const [prodImage, setProdImage] = useState('')
  const [prodCategory, setProdCategory] = useState('Kits & Vestuário')

  // Redemptions ("Meus Resgates" & Admin Orders Management)
  const [redemptions, setRedemptions] = useState<NexPRedemption[]>(() => getNexPRedemptions())
  const [showRedemptionsModal, setShowRedemptionsModal] = useState(false)
  const [redemptionsPage, setRedemptionsPage] = useState(1)
  const [adminOrderFilter, setAdminOrderFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending')

  // Daily Missions
  const [missions, setMissions] = useState<DailyMission[]>(() => getDailyMissions())
  const [completedMissions, setCompletedMissions] = useState<string[]>([])
  const [showMissionModal, setShowMissionModal] = useState(false)
  const [editingMission, setEditingMission] = useState<DailyMission | null>(null)
  const [missionTitle, setMissionTitle] = useState('')
  const [missionDesc, setMissionDesc] = useState('')
  const [missionPoints, setMissionPoints] = useState(30)

  // How It Works Modal
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false)
  const [howItWorksStep, setHowItWorksStep] = useState(0)

  // Leaderboard & All Badges
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [allBadges, setAllBadges] = useState<BadgeType[]>([])
  const [showBadgesModal, setShowBadgesModal] = useState(false)
  const [badgesPage, setBadgesPage] = useState(1)

  // Admin Badge CRUD inside Badges Modal
  const DEFAULT_BADGE_SQL = `SELECT u."Id"
FROM "Users" u
LEFT JOIN "UserStats" s ON s."UserId" = u."Id"
WHERE u."Role" = 0
  AND (u."NexPoints" >= @RequiredPoints OR COALESCE(s."TotalXp", 0) >= @RequiredPoints)
  AND NOT EXISTS (
      SELECT 1 FROM "UserBadges" ub
      WHERE ub."UserId" = u."Id" AND ub."BadgeId" = @BadgeId
  )`

  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null)
  const [showBadgeForm, setShowBadgeForm] = useState(false)
  const [badgeName, setBadgeName] = useState('')
  const [badgeDesc, setBadgeDesc] = useState('')
  const [badgePoints, setBadgePoints] = useState(200)
  const [badgeRarity, setBadgeRarity] = useState(0)
  const [badgeIconUrl, setBadgeIconUrl] = useState('')
  const [badgeCriteriaSql, setBadgeCriteriaSql] = useState(DEFAULT_BADGE_SQL)
  const [isRunningWorker, setIsRunningWorker] = useState(false)

  useEffect(() => {
    if (user?.id && !isAdmin) {
      setCompletedMissions(getCompletedMissionsToday(user.id))
    }
  }, [user?.id, isAdmin])

  const loadLeaderboardAndBadges = async () => {
    try {
      const [lbData, badgesData] = await Promise.all([
        ranksApi.getLeaderboard(token || undefined),
        badgesApi.getAll(token || undefined),
      ])
      if (lbData) setLeaderboard(lbData)
      if (badgesData) setAllBadges(badgesData)
    } catch {
      // fallback handled gracefully
    }
  }

  useEffect(() => {
    loadLeaderboardAndBadges()
  }, [token])

  const currentPoints = stats?.totalXp ?? user?.nexPoints ?? 0
  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId))

  // Trava de 1 pedido de benefício pendente por vez para o usuário
  const myRedemptions = redemptions.filter((r) => r.userId === user?.id)
  const activePendingRedemption = myRedemptions.find((r) => r.status === 'Pending')

  // Filtered store products
  const categories = ['Todas', ...Array.from(new Set(products.map((p) => p.category)))]
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !storeSearch.trim() ||
      p.title.toLowerCase().includes(storeSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(storeSearch.toLowerCase())
    const matchCat = storeCategory === 'Todas' || p.category === storeCategory
    return matchSearch && matchCat
  })

  const visibleProducts = filteredProducts.slice(carouselOffset, carouselOffset + 5)

  const handleCompleteMission = async (mission: DailyMission) => {
    if (!user || isAdmin) return
    if (completedMissions.includes(mission.id)) return
    const updated = markMissionCompletedToday(user.id, mission.id)
    setCompletedMissions(updated)
    await addXp(mission.points)
    showToast(`Missão "${mission.title}" concluída!`, {
      type: 'success',
      subtitle: 'Recompensa diária creditada no seu saldo.',
    })
  }

  const handleRedeemProduct = (product: NexPProduct) => {
    if (!user || isAdmin) return

    // Trava: apenas 1 pedido pendente por vez
    if (activePendingRedemption) {
      showToast('Apenas 1 pedido de benefício por vez!', {
        type: 'warning',
        subtitle: `Você já possui o pedido "${activePendingRedemption.productTitle}" aguardando aprovação da liderança.`,
      })
      return
    }

    if (currentPoints < product.cost) {
      showToast('Saldo insuficiente de NexPoints', {
        type: 'error',
        subtitle: `Este benefício requer ${product.cost} NexP (seu saldo atual: ${currentPoints} NexP).`,
      })
      return
    }

    const newRedemption: NexPRedemption = {
      id: `redemp-${Date.now()}`,
      productId: product.id,
      productTitle: product.title,
      productDescription: product.description,
      productImageUrl: product.imageUrl,
      cost: product.cost,
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      userPhoto: user.photoUrl,
      userPoints: currentPoints,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }
    const updated = [newRedemption, ...getNexPRedemptions()]
    saveNexPRedemptions(updated)
    setRedemptions(updated)

    showToast('Pedido de benefício enviado!', {
      type: 'success',
      subtitle: `"${product.title}" foi registrado e aguarda aprovação da liderança.`,
    })
  }

  // Admin: Aprovar ou Reprovar Pedido de Benefício diretamente na Gestão da Loja
  const handleAdminApproveRedemption = async (redemp: NexPRedemption) => {
    const updated = redemptions.map((r) =>
      r.id === redemp.id ? { ...r, status: 'Approved' as const } : r
    )
    saveNexPRedemptions(updated)
    setRedemptions(updated)
    if (redemp.userId && redemp.cost) {
      await statsApi.addXp(redemp.userId, -Math.abs(redemp.cost), token || undefined).catch(() => {})
    }
    showToast('Pedido de benefício aprovado!', {
      type: 'success',
      subtitle: `Resgate de "${redemp.productTitle}" para ${redemp.userName} homologado.`,
    })
  }

  const handleAdminRejectRedemption = (redemp: NexPRedemption) => {
    const updated = redemptions.map((r) =>
      r.id === redemp.id ? { ...r, status: 'Rejected' as const } : r
    )
    saveNexPRedemptions(updated)
    setRedemptions(updated)
    showToast('Pedido de benefício reprovado', {
      type: 'info',
      subtitle: `A solicitação de ${redemp.userName} foi marcada como reprovada.`,
    })
  }

  // Product Admin CRUD
  const openCreateProduct = () => {
    setEditingProduct(null)
    setProdTitle('')
    setProdDesc('')
    setProdCost(500)
    setProdImage('https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80')
    setProdCategory('Kits & Vestuário')
    setShowProductModal(true)
  }

  const openEditProduct = (prod: NexPProduct) => {
    setEditingProduct(prod)
    setProdTitle(prod.title)
    setProdDesc(prod.description)
    setProdCost(prod.cost)
    setProdImage(prod.imageUrl)
    setProdCategory(prod.category)
    setShowProductModal(true)
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prodTitle.trim()) return
    let updated: NexPProduct[]
    if (editingProduct) {
      updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              title: prodTitle.trim(),
              description: prodDesc.trim(),
              cost: Number(prodCost) || 100,
              imageUrl: prodImage.trim(),
              category: prodCategory.trim() || 'Geral',
            }
          : p
      )
      showToast('Produto atualizado na loja!', { type: 'success', subtitle: prodTitle.trim() })
    } else {
      const newProd: NexPProduct = {
        id: `prod-${Date.now()}`,
        title: prodTitle.trim(),
        description: prodDesc.trim(),
        cost: Number(prodCost) || 100,
        imageUrl:
          prodImage.trim() ||
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
        category: prodCategory.trim() || 'Geral',
        stock: 10,
      }
      updated = [newProd, ...products]
      showToast('Novo produto adicionado à loja!', { type: 'success', subtitle: prodTitle.trim() })
    }
    setProducts(updated)
    saveNexPProducts(updated)
    setShowProductModal(false)
  }

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id)
    setProducts(updated)
    saveNexPProducts(updated)
    showToast('Produto removido da loja', { type: 'info' })
  }

  // Mission Admin CRUD
  const openCreateMission = () => {
    setEditingMission(null)
    setMissionTitle('')
    setMissionDesc('')
    setMissionPoints(30)
    setShowMissionModal(true)
  }

  const openEditMission = (m: DailyMission) => {
    setEditingMission(m)
    setMissionTitle(m.title)
    setMissionDesc(m.description)
    setMissionPoints(m.points)
    setShowMissionModal(true)
  }

  const handleSaveMission = (e: React.FormEvent) => {
    e.preventDefault()
    if (!missionTitle.trim()) return
    let updated: DailyMission[]
    if (editingMission) {
      updated = missions.map((m) =>
        m.id === editingMission.id
          ? { ...m, title: missionTitle.trim(), description: missionDesc.trim(), points: Number(missionPoints) || 10 }
          : m
      )
      showToast('Missão diária atualizada!', { type: 'success', subtitle: missionTitle.trim() })
    } else {
      updated = [
        ...missions,
        {
          id: `mission-${Date.now()}`,
          title: missionTitle.trim(),
          description: missionDesc.trim(),
          points: Number(missionPoints) || 10,
          criteriaKey: 'custom',
        },
      ]
      showToast('Nova missão diária cadastrada!', { type: 'success', subtitle: missionTitle.trim() })
    }
    setMissions(updated)
    saveDailyMissions(updated)
    setShowMissionModal(false)
  }

  const handleDeleteMission = (id: string) => {
    const updated = missions.filter((m) => m.id !== id)
    setMissions(updated)
    saveDailyMissions(updated)
    showToast('Missão diária excluída', { type: 'info' })
  }

  // Badge Admin CRUD
  const openCreateBadge = () => {
    setEditingBadge(null)
    setBadgeName('')
    setBadgeDesc('')
    setBadgePoints(250)
    setBadgeRarity(0)
    setBadgeIconUrl('')
    setBadgeCriteriaSql(DEFAULT_BADGE_SQL)
    setShowBadgeForm(true)
  }

  const openEditBadge = (b: BadgeType) => {
    setEditingBadge(b)
    setBadgeName(b.name)
    setBadgeDesc(b.description)
    setBadgePoints(b.requiredPoints)
    setBadgeRarity(Number(b.rarity) || 0)
    setBadgeIconUrl(b.iconUrl || '')
    setBadgeCriteriaSql(b.criteria && b.criteria.trim().length > 0 ? b.criteria : DEFAULT_BADGE_SQL)
    setShowBadgeForm(true)
  }

  const handleRunBadgeWorkerNow = async () => {
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
      await loadLeaderboardAndBadges()
    } catch {
      showToast('Não foi possível acionar o Worker manualmente.', { type: 'error' })
    } finally {
      setIsRunningWorker(false)
    }
  }

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!badgeName.trim()) return
    try {
      if (editingBadge) {
        await badgesApi.update(
          editingBadge.id,
          {
            name: badgeName.trim(),
            description: badgeDesc.trim(),
            requiredPoints: Number(badgePoints) || 0,
            rarity: Number(badgeRarity) || 0,
            iconUrl: badgeIconUrl.trim() || undefined,
            criteria: badgeCriteriaSql.trim() || DEFAULT_BADGE_SQL,
          },
          token || undefined
        )
        showToast('Emblema e query de relatório atualizados!', {
          type: 'success',
          subtitle: `${badgeName.trim()} — O Worker já reavaliou os usuários elegíveis.`,
        })
      } else {
        await badgesApi.create(
          {
            name: badgeName.trim(),
            description: badgeDesc.trim(),
            requiredPoints: Number(badgePoints) || 0,
            rarity: Number(badgeRarity) || 0,
            iconUrl: badgeIconUrl.trim() || undefined,
            criteria: badgeCriteriaSql.trim() || DEFAULT_BADGE_SQL,
          },
          token || undefined
        )
        showToast('Novo emblema e query SQL cadastrados!', {
          type: 'success',
          subtitle: `${badgeName.trim()} — O Worker agendado executará esta query automaticamente.`,
        })
      }
      await loadLeaderboardAndBadges()
      await refreshBadges()
      setShowBadgeForm(false)
    } catch {
      setShowBadgeForm(false)
    }
  }

  const handleDeleteBadge = async (id: string) => {
    try {
      await badgesApi.delete(id, token || undefined)
      await loadLeaderboardAndBadges()
      showToast('Emblema removido', { type: 'info' })
    } catch {
      setAllBadges((prev) => prev.filter((b) => b.id !== id))
    }
  }

  // My Redemptions pagination (20 per page)
  const REDEMPTIONS_PER_PAGE = 20
  const totalRedemptionPages = Math.max(1, Math.ceil(myRedemptions.length / REDEMPTIONS_PER_PAGE))
  const paginatedRedemptions = myRedemptions.slice(
    (redemptionsPage - 1) * REDEMPTIONS_PER_PAGE,
    redemptionsPage * REDEMPTIONS_PER_PAGE
  )

  // Admin filtered orders
  const filteredAdminOrders = redemptions.filter((r) =>
    adminOrderFilter === 'All' ? true : r.status === adminOrderFilter
  )

  // Badges Modal pagination (20 per page)
  const BADGES_PER_PAGE = 20
  const totalBadgePages = Math.max(1, Math.ceil(allBadges.length / BADGES_PER_PAGE))
  const paginatedBadges = allBadges.slice((badgesPage - 1) * BADGES_PER_PAGE, badgesPage * BADGES_PER_PAGE)

  const howItWorksSlides = [
    {
      title: '1. Ganhe NexPoints Diariamente',
      icon: '⚡',
      desc: 'Ao realizar seu login diário, revisar processos operacionais, publicar artigos/estudos de caso e responder quizzes de fixação, você acumula NexPoints automaticamente.',
    },
    {
      title: '2. Suba no Ranking e Conquiste Emblemas',
      icon: '🏆',
      desc: 'Seus NexPoints elevam sua patente (Bronze até Lenda) no Leaderboard corporativo e desbloqueiam emblemas exclusivos na sua galeria.',
    },
    {
      title: '3. Troque por Benefícios Reais na Loja NexP',
      icon: '🎁',
      desc: 'Utilize seus NexPoints para solicitar produtos, cursos, certificações ou experiências (limite de 1 pedido em análise por vez). Acompanhe o status em "Meus Resgates".',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner — Separado entre Visão Administrativa de Gestão vs Visão Colaborador */}
      {isAdmin ? (
        <Card className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-0 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Portal Administrativo • Gestão NexP & Loja</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Gestão da Loja de Benefícios, Pedidos, Missões e Emblemas
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                Atenda aos pedidos de resgate dos colaboradores e gerencie o catálogo de produtos, missões diárias e emblemas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={openCreateProduct}>
                + Novo Produto na Loja
              </Button>
              <Button size="sm" variant="outline" className="text-white border-white/30 hover:bg-white/10" onClick={openCreateMission}>
                + Nova Missão Diária
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10 flex items-center gap-1.5"
                onClick={() => {
                  setBadgesPage(1)
                  setShowBadgesModal(true)
                }}
              >
                <Award className="w-4 h-4" />
                <span>Gerenciar Emblemas</span>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-gradient-to-r from-indigo-950 via-blue-900 to-slate-900 text-white border-0 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Módulo Oficial NexP • Gamificação & Benefícios</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Central NexP — Aprenda, Evolua e Resgate Recompensas
              </h1>
              <p className="text-sm text-blue-100 leading-relaxed">
                Cada contribuição na Base de Conhecimento, revisão de processo e atividade concluída gera{' '}
                <strong>NexPoints</strong> que podem ser trocados por benefícios exclusivos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-5 py-3 text-center">
                <p className="text-xs text-blue-200 uppercase tracking-wider">Saldo Disponível</p>
                <p className="text-2xl font-extrabold text-amber-300">{currentPoints} NexP</p>
                <p className="text-[11px] text-blue-200">Rank: {rank?.rankName || 'Bronze'}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => {
                    setRedemptions(getNexPRedemptions())
                    setShowRedemptionsModal(true)
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Meus Resgates ({myRedemptions.length})</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10 flex items-center gap-1.5"
                  onClick={() => {
                    setHowItWorksStep(0)
                    setShowHowItWorksModal(true)
                  }}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Como funciona o NexP</span>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ADMIN SECTION: Atendimento de Pedidos de Benefícios da Loja */}
      {isAdmin && (
        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Inbox className="w-5 h-5 text-amber-600" />
                <span>Atendimento de Pedidos de Benefícios da Loja</span>
              </h2>
              <p className="text-xs text-slate-500">
                Aprove ou reprove solicitações de resgate feitas pelos colaboradores
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'Pending', label: `Pendentes (${redemptions.filter((r) => r.status === 'Pending').length})` },
                { id: 'Approved', label: `Aprovados (${redemptions.filter((r) => r.status === 'Approved').length})` },
                { id: 'Rejected', label: `Reprovados (${redemptions.filter((r) => r.status === 'Rejected').length})` },
                { id: 'All', label: 'Todos' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAdminOrderFilter(t.id as typeof adminOrderFilter)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    adminOrderFilter === t.id ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAdminOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              Nenhum pedido de benefício neste filtro no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAdminOrders.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={r.productImageUrl}
                      alt={r.productTitle}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{r.productTitle}</h4>
                        <Badge variant="warning">{r.cost} NexP</Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Solicitante: <strong>{r.userName}</strong> ({r.userEmail}) • Saldo no pedido:{' '}
                        <strong>{r.userPoints} NexP</strong>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Solicitado em {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === 'Pending' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                          onClick={() => handleAdminRejectRedemption(r)}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reprovar</span>
                        </Button>
                        <Button size="sm" className="flex items-center gap-1" onClick={() => handleAdminApproveRedemption(r)}>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aprovar Resgate</span>
                        </Button>
                      </>
                    ) : (
                      <Badge variant={r.status === 'Approved' ? 'success' : 'error'}>
                        {r.status === 'Approved' ? 'Aprovado' : 'Reprovado'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* USER SECTION: Aviso de Pedido em Andamento (Trava de 1 pedido por vez) */}
      {!isAdmin && activePendingRedemption && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <img
              src={activePendingRedemption.productImageUrl}
              alt={activePendingRedemption.productTitle}
              className="w-12 h-12 rounded-xl object-cover border border-amber-300 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase">
                  ⏳ Pedido em Análise (1 por vez)
                </span>
                <span className="text-xs font-bold text-amber-800">
                  {activePendingRedemption.cost} NexP
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                {activePendingRedemption.productTitle}
              </h4>
              <p className="text-xs text-amber-800">
                Seu pedido foi registrado com sucesso! Aguarde a aprovação da liderança antes de solicitar um novo benefício.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRedemptions(getNexPRedemptions())
              setShowRedemptionsModal(true)
            }}
          >
            Ver em Meus Resgates
          </Button>
        </div>
      )}

      {/* Static Explanation Strip (apenas para Usuário Comum) */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {howItWorksSlides.map((s, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3.5 shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
                {s.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Daily Missions + Conquistas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Missions (5 principais) */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>{isAdmin ? 'Gestão de Missões Diárias Cadastradas' : 'Missões Diárias (5 Principais)'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Adicione, edite ou remova missões diárias disponíveis para os colaboradores'
                  : 'Complete as missões de hoje para ganhar bônus extras de NexPoints'}
              </p>
            </div>
            {isAdmin && (
              <Button size="sm" onClick={openCreateMission}>
                + Nova Missão
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {missions.slice(0, 5).map((mission) => {
              const done = !isAdmin && completedMissions.includes(mission.id)
              return (
                <div
                  key={mission.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    done ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/70 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Target className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <h4 className={`text-sm font-bold ${done ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>
                        {mission.title}
                      </h4>
                      <Badge variant={done ? 'success' : 'info'}>+{mission.points} NexP</Badge>
                    </div>
                    <p className="text-xs text-slate-600 pl-6">{mission.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                    {!isAdmin ? (
                      done ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                          Resgatado Hoje
                        </span>
                      ) : (
                        <Button size="sm" onClick={() => handleCompleteMission(mission)}>
                          Resgatar +{mission.points} NexP
                        </Button>
                      )
                    ) : (
                      <>
                        <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => openEditMission(mission)}>
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                          onClick={() => handleDeleteMission(mission.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Emblemas Cadastrados / Conquistas Recentes */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>{isAdmin ? 'Catálogo de Emblemas' : 'Conquistas Recentes'}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {isAdmin ? 'Gerencie os emblemas e regras de pontuação' : '5 emblemas em destaque na plataforma'}
                </p>
              </div>
              <button
                onClick={() => {
                  setBadgesPage(1)
                  setShowBadgesModal(true)
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                {isAdmin ? 'Gerenciar Todos' : 'Ver Todos'}
              </button>
            </div>

            <div className="space-y-3">
              {(allBadges.length > 0 ? allBadges.slice(0, 5) : []).map((b) => {
                const isUnlocked = !isAdmin && earnedBadgeIds.has(b.id)
                const userBadge = userBadges.find((ub) => ub.badgeId === b.id)
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (!isAdmin && isUnlocked && userBadge) {
                        showBadgeModal(userBadge)
                      } else {
                        setShowBadgesModal(true)
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isUnlocked
                        ? 'bg-amber-50/50 border-amber-200 hover:shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                        isAdmin || isUnlocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isAdmin || isUnlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{b.name}</h4>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                          {b.requiredPoints > 0 ? `${b.requiredPoints} NexP` : 'Missão'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{b.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              setBadgesPage(1)
              setShowBadgesModal(true)
            }}
          >
            <Trophy className="w-4 h-4 mr-1.5" />{' '}
            {isAdmin ? 'Abrir Catálogo e Editar Emblemas' : 'Ver Todos os Emblemas e Como Ganhar'}
          </Button>
        </Card>
      </div>

      {/* NexP Benefits Store (5 items with lateral arrows) */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <span>{isAdmin ? 'Gestão de Produtos da Loja NexP' : 'Loja de Benefícios NexP'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {isAdmin
                ? 'Adicione, edite ou remova os produtos e benefícios disponíveis para resgate pelos colaboradores.'
                : 'Resgate produtos e experiências utilizando seus NexPoints (limite de 1 pedido pendente por vez).'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={storeSearch}
              onChange={(e) => {
                setStoreSearch(e.target.value)
                setCarouselOffset(0)
              }}
              placeholder="Buscar prêmio ou benefício..."
              className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={storeCategory}
              onChange={(e) => {
                setStoreCategory(e.target.value)
                setCarouselOffset(0)
              }}
              className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {isAdmin && (
              <Button size="sm" onClick={openCreateProduct}>
                + Adicionar Produto
              </Button>
            )}
          </div>
        </div>

        {/* Carousel Controls + 5 items */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500">
              Exibindo {visibleProducts.length} de {filteredProducts.length} benefícios disponíveis
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={carouselOffset === 0}
                onClick={() => setCarouselOffset((prev) => Math.max(0, prev - 1))}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={carouselOffset + 5 >= filteredProducts.length}
                onClick={() => setCarouselOffset((prev) => prev + 1)}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                title="Próximo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {visibleProducts.map((product) => {
              const canAfford = currentPoints >= product.cost
              const isThisProductPending = activePendingRedemption?.productId === product.id
              return (
                <div
                  key={product.id}
                  className={`rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isThisProductPending ? 'border-amber-400 bg-amber-50/30 ring-2 ring-amber-300' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="h-36 bg-slate-100 relative overflow-hidden">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80'
                        }}
                      />
                      <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                        {product.category}
                      </span>
                      <span className="absolute bottom-2 right-2 bg-amber-500 text-slate-950 text-xs font-extrabold px-2.5 py-1 rounded-lg shadow">
                        {product.cost} NexP
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{product.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{product.description}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 space-y-2">
                    {!isAdmin ? (
                      <Button
                        size="sm"
                        className="w-full flex items-center justify-center gap-1.5"
                        variant={
                          isThisProductPending
                            ? 'secondary'
                            : activePendingRedemption
                            ? 'outline'
                            : canAfford
                            ? 'primary'
                            : 'outline'
                        }
                        onClick={() => handleRedeemProduct(product)}
                      >
                        {isThisProductPending ? (
                          <>
                            <Clock className="w-4 h-4" />
                            <span>Pedido em Análise</span>
                          </>
                        ) : activePendingRedemption ? (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Aguardando Pedido Atual</span>
                          </>
                        ) : canAfford ? (
                          <>
                            <Gift className="w-4 h-4" />
                            <span>Solicitar Resgate</span>
                          </>
                        ) : (
                          `Faltam ${product.cost - currentPoints} NexP`
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <Button size="sm" variant="outline" className="flex-1 flex items-center justify-center gap-1" onClick={() => openEditProduct(product)}>
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Leaderboard Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>Quadro de Leaderboard Corporativo</span>
            </h2>
            <p className="text-xs text-slate-500">Top 20 colaboradores com maior pontuação de NexPoints</p>
          </div>
          {!isAdmin && <Badge variant="info">Seu Saldo: {currentPoints} NexP</Badge>}
        </div>

        {/* Podium Top 3 */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {leaderboard.slice(0, 3).map((entry, idx) => {
              const medals = ['🥇 1º Lugar', '🥈 2º Lugar', '🥉 3º Lugar']
              const borders = [
                'border-amber-300 bg-gradient-to-b from-amber-50 to-white',
                'border-slate-300 bg-gradient-to-b from-slate-50 to-white',
                'border-orange-300 bg-gradient-to-b from-orange-50/60 to-white',
              ]
              return (
                <div key={entry.userId} className={`p-4 rounded-xl border ${borders[idx]} text-center shadow-sm`}>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    {medals[idx]}
                  </span>
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto my-2 text-lg">
                    {entry.userName.charAt(0)}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{entry.userName}</h4>
                  <p className="text-xs text-slate-500">{entry.rankName}</p>
                  <p className="text-base font-extrabold text-blue-600 mt-1">{entry.totalXp} NexP</p>
                </div>
              )
            })}
          </div>
        )}

        <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="py-3 px-4">Posição</th>
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-4">Patente / Rank</th>
                <th className="py-3 px-4 text-right">NexPoints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {leaderboard.slice(0, 20).map((entry, index) => (
                <tr
                  key={entry.userId}
                  className={!isAdmin && entry.userId === user?.id ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'}
                >
                  <td className="py-2.5 px-4 font-bold text-slate-700">#{entry.position || index + 1}</td>
                  <td className="py-2.5 px-4 text-slate-900">
                    {entry.userName} {!isAdmin && entry.userId === user?.id && <Badge variant="info">Você</Badge>}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{entry.rankName}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-blue-600">{entry.totalXp} NexP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Meus Resgates (Apenas Usuário Comum - 20 por página) */}
      {showRedemptionsModal && !isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl p-6 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" /> Meus Resgates NexP
                </h3>
                <p className="text-xs text-slate-500">
                  Histórico dos seus pedidos de benefícios e status de aprovação da liderança
                </p>
              </div>
              <button
                onClick={() => setShowRedemptionsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-3">
              {paginatedRedemptions.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-10">
                  Você ainda não solicitou nenhum resgate na loja.
                </p>
              ) : (
                paginatedRedemptions.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={r.productImageUrl}
                        alt={r.productTitle}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{r.productTitle}</h4>
                        <p className="text-xs text-slate-500">
                          Solicitado em {new Date(r.createdAt).toLocaleDateString('pt-BR')} • Custo:{' '}
                          <strong>{r.cost} NexP</strong>
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        r.status === 'Approved' ? 'success' : r.status === 'Rejected' ? 'error' : 'warning'
                      }
                    >
                      {r.status === 'Approved'
                        ? '✅ Aprovado pela Liderança'
                        : r.status === 'Rejected'
                        ? '❌ Reprovado'
                        : '⏳ Pendente de Aprovação'}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Página {redemptionsPage} de {totalRedemptionPages} ({myRedemptions.length} registros)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={redemptionsPage <= 1}
                  onClick={() => setRedemptionsPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={redemptionsPage >= totalRedemptionPages}
                  onClick={() => setRedemptionsPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Como Funciona (com navegação em setas) */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 text-center space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Como Funciona o Módulo NexP</h3>
              <button onClick={() => setShowHowItWorksModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 px-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
              <div className="text-5xl">{howItWorksSlides[howItWorksStep].icon}</div>
              <h4 className="text-xl font-bold text-slate-900">{howItWorksSlides[howItWorksStep].title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{howItWorksSlides[howItWorksStep].desc}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={howItWorksStep === 0}
                onClick={() => setHowItWorksStep((s) => Math.max(0, s - 1))}
              >
                ◀ Anterior
              </Button>
              <span className="text-xs font-semibold text-slate-500">
                Etapa {howItWorksStep + 1} de {howItWorksSlides.length}
              </span>
              {howItWorksStep < howItWorksSlides.length - 1 ? (
                <Button size="sm" onClick={() => setHowItWorksStep((s) => s + 1)}>
                  Próximo ▶
                </Button>
              ) : (
                <Button size="sm" onClick={() => setShowHowItWorksModal(false)}>
                  Entendi!
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Todos os Emblemas (20 por página + CRUD Admin) */}
      {showBadgesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>{isAdmin ? 'Gestão de Emblemas do Sistema' : 'Todos os Emblemas e Regras de Desbloqueio'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isAdmin
                    ? 'Adicione, edite ou exclua emblemas disponíveis para os colaboradores'
                    : 'Veja como desbloquear cada conquista (exibindo até 20 emblemas por página)'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRunningWorker}
                      onClick={handleRunBadgeWorkerNow}
                    >
                      {isRunningWorker ? 'Executando Queries...' : 'Executar Worker Agora'}
                    </Button>
                    <Button size="sm" onClick={openCreateBadge}>
                      + Novo Emblema
                    </Button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowBadgesModal(false)
                    setShowBadgeForm(false)
                  }}
                  className="text-slate-400 hover:text-slate-700 text-lg px-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showBadgeForm && isAdmin && (
              <form
                onSubmit={handleSaveBadge}
                className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    {editingBadge ? 'Editar Emblema & Query SQL do Relatório' : 'Adicionar Novo Emblema & Query SQL do Relatório'}
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                    Worker Schedule Ativo (a cada 30s)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={badgeName}
                    onChange={(e) => setBadgeName(e.target.value)}
                    placeholder="Nome do Emblema"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                  <input
                    type="number"
                    min={0}
                    required
                    value={badgePoints}
                    onChange={(e) => setBadgePoints(Number(e.target.value))}
                    placeholder="Meta / @RequiredPoints"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                  <select
                    value={badgeRarity}
                    onChange={(e) => setBadgeRarity(Number(e.target.value))}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={0}>Comum</option>
                    <option value={1}>Raro</option>
                    <option value={2}>Épico</option>
                    <option value={3}>Lendário</option>
                  </select>
                </div>
                <input
                  type="text"
                  required
                  value={badgeDesc}
                  onChange={(e) => setBadgeDesc(e.target.value)}
                  placeholder="Descrição exibida para o colaborador (ex: Alcançou 1000 NexPoints na plataforma)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                />

                {/* SQL Report Query Registration (Dev / Admin) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Query SQL do Relatório de Premiação (Coluna Criteria — Executada pelo Worker Schedule)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setBadgeCriteriaSql(`SELECT u."Id"
FROM "Users" u
LEFT JOIN "UserStats" s ON s."UserId" = u."Id"
WHERE u."Role" = 0
  AND (u."NexPoints" >= @RequiredPoints OR COALESCE(s."TotalXp", 0) >= @RequiredPoints)
  AND NOT EXISTS (
      SELECT 1 FROM "UserBadges" ub
      WHERE ub."UserId" = u."Id" AND ub."BadgeId" = @BadgeId
  )`)
                        }
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        Template: NexPoints &gt;= @RequiredPoints
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
                        Template: Quizzes &gt;= 5
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
                        Template: Cursos &gt;= 3
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
                        Template: Ofensiva &gt;= 7 Dias
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setBadgeCriteriaSql(`SELECT u."Id"
FROM "Users" u
WHERE u."Role" = 0
  AND (
    (SELECT COUNT(*) FROM "Contents" c WHERE c."AuthorId" = u."Id") +
    (SELECT COUNT(*) FROM "Processes" p WHERE p."AuthorId" = u."Id")
  ) >= 3
  AND NOT EXISTS (
      SELECT 1 FROM "UserBadges" ub
      WHERE ub."UserId" = u."Id" AND ub."BadgeId" = @BadgeId
  )`)
                        }
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800 hover:bg-slate-300"
                      >
                        Template: Publicações &gt;= 3
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    required
                    value={badgeCriteriaSql}
                    onChange={(e) => setBadgeCriteriaSql(e.target.value)}
                    placeholder='SELECT u."Id" FROM "Users" u WHERE u."Role" = 0 AND u."NexPoints" >= @RequiredPoints ...'
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-slate-900 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Parâmetros injetados automaticamente pelo Worker: <code>@BadgeId</code> (ID deste emblema) e{' '}
                    <code>@RequiredPoints</code> (valor preenchido no campo de meta acima). A query deve retornar a coluna{' '}
                    <code>u."Id"</code> dos usuários elegíveis.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowBadgeForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    Salvar Emblema & Query SQL
                  </Button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto my-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paginatedBadges.map((b) => {
                const unlocked = !isAdmin && earnedBadgeIds.has(b.id)
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                      unlocked ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isAdmin || unlocked ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isAdmin || unlocked ? <Trophy className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{b.name}</h4>
                            <Badge variant={unlocked ? 'success' : 'info'}>
                              {unlocked ? 'Desbloqueado' : `${b.requiredPoints} NexP`}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{b.description}</p>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditBadge(b)}
                            className="p-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar Emblema e Query SQL"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBadge(b.id)}
                            className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isAdmin && b.criteria && (
                      <div className="p-2 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap max-h-20 overflow-y-auto">
                        {b.criteria}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Página {badgesPage} de {totalBadgePages} ({allBadges.length} emblemas)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={badgesPage <= 1}
                  onClick={() => setBadgesPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={badgesPage >= totalBadgePages}
                  onClick={() => setBadgesPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Adicionar/Editar Produto da Loja (Admin) */}
      {showProductModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingProduct ? 'Editar Produto da Loja NexP' : 'Novo Produto Resgatável'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  required
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custo (NexPoints)</label>
                  <input
                    type="number"
                    min={10}
                    required
                    value={prodCost}
                    onChange={(e) => setProdCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  required
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Imagem do Produto</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="URL da imagem ou envie um arquivo"
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <ImageUploadButton onImageUploaded={(url) => setProdImage(url)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Produto</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Adicionar/Editar Missão Diária (Admin) */}
      {showMissionModal && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingMission ? 'Editar Missão Diária' : 'Nova Missão Diária'}
            </h3>
            <form onSubmit={handleSaveMission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título da Missão</label>
                <input
                  type="text"
                  required
                  value={missionTitle}
                  onChange={(e) => setMissionTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  required
                  value={missionDesc}
                  onChange={(e) => setMissionDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recompensa (NexPoints)</label>
                <input
                  type="number"
                  min={5}
                  required
                  value={missionPoints}
                  onChange={(e) => setMissionPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowMissionModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Missão</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
