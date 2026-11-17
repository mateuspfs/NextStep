import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { badgesApi, ranksApi, Badge as BadgeType, LeaderboardEntry } from '../services/api'
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
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ImageUploadButton from '../components/ui/ImageUploadButton'

export default function NexP() {
  const { user, token } = useAuth()
  const { stats, rank, badges: userBadges, addXp, refreshBadges, showBadgeModal } = useUser()
  const isAdmin = user?.role === 'Admin'

  // Products & Carousel
  const [products, setProducts] = useState<NexPProduct[]>(() => getNexPProducts())
  const [storeSearch, setStoreSearch] = useState('')
  const [storeCategory, setStoreCategory] = useState('Todas')
  const [carouselOffset, setCarouselOffset] = useState(0)
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null)

  // Product Admin Modal
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<NexPProduct | null>(null)
  const [prodTitle, setProdTitle] = useState('')
  const [prodDesc, setProdDesc] = useState('')
  const [prodCost, setProdCost] = useState(500)
  const [prodImage, setProdImage] = useState('')
  const [prodCategory, setProdCategory] = useState('Kits & Vestuário')

  // Redemptions ("Meus Resgates")
  const [redemptions, setRedemptions] = useState<NexPRedemption[]>(() => getNexPRedemptions())
  const [showRedemptionsModal, setShowRedemptionsModal] = useState(false)
  const [redemptionsPage, setRedemptionsPage] = useState(1)

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
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null)
  const [showBadgeForm, setShowBadgeForm] = useState(false)
  const [badgeName, setBadgeName] = useState('')
  const [badgeDesc, setBadgeDesc] = useState('')
  const [badgePoints, setBadgePoints] = useState(200)
  const [badgeRarity, setBadgeRarity] = useState(0)
  const [badgeIconUrl, setBadgeIconUrl] = useState('')

  useEffect(() => {
    if (user?.id) {
      setCompletedMissions(getCompletedMissionsToday(user.id))
    }
  }, [user?.id])

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
    if (!user) return
    if (completedMissions.includes(mission.id)) return
    const updated = markMissionCompletedToday(user.id, mission.id)
    setCompletedMissions(updated)
    await addXp(mission.points)
    setPurchaseToast(`⚡ Missão "${mission.title}" concluída! +${mission.points} NexPoints adicionados.`)
    setTimeout(() => setPurchaseToast(null), 4000)
  }

  const handleRedeemProduct = (product: NexPProduct) => {
    if (!user) return
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
    setPurchaseToast(
      `🛍️ Solicitação de resgate para "${product.title}" enviada! Pendente de aprovação da liderança.`
    )
    setTimeout(() => setPurchaseToast(null), 5000)
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
    }
    setProducts(updated)
    saveNexPProducts(updated)
    setShowProductModal(false)
  }

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id)
    setProducts(updated)
    saveNexPProducts(updated)
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
    }
    setMissions(updated)
    saveDailyMissions(updated)
    setShowMissionModal(false)
  }

  const handleDeleteMission = (id: string) => {
    const updated = missions.filter((m) => m.id !== id)
    setMissions(updated)
    saveDailyMissions(updated)
  }

  // Badge Admin CRUD
  const openCreateBadge = () => {
    setEditingBadge(null)
    setBadgeName('')
    setBadgeDesc('')
    setBadgePoints(250)
    setBadgeRarity(0)
    setBadgeIconUrl('')
    setShowBadgeForm(true)
  }

  const openEditBadge = (b: BadgeType) => {
    setEditingBadge(b)
    setBadgeName(b.name)
    setBadgeDesc(b.description)
    setBadgePoints(b.requiredPoints)
    setBadgeRarity(Number(b.rarity) || 0)
    setBadgeIconUrl(b.iconUrl || '')
    setShowBadgeForm(true)
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
          },
          token || undefined
        )
      } else {
        await badgesApi.create(
          {
            name: badgeName.trim(),
            description: badgeDesc.trim(),
            requiredPoints: Number(badgePoints) || 0,
            rarity: Number(badgeRarity) || 0,
            iconUrl: badgeIconUrl.trim() || undefined,
          },
          token || undefined
        )
      }
      await loadLeaderboardAndBadges()
      await refreshBadges()
      setShowBadgeForm(false)
    } catch {
      // fallback local update if offline
      setShowBadgeForm(false)
    }
  }

  const handleDeleteBadge = async (id: string) => {
    try {
      await badgesApi.delete(id, token || undefined)
      await loadLeaderboardAndBadges()
    } catch {
      setAllBadges((prev) => prev.filter((b) => b.id !== id))
    }
  }

  // My Redemptions pagination (20 per page)
  const myRedemptions = isAdmin ? redemptions : redemptions.filter((r) => r.userId === user?.id)
  const REDEMPTIONS_PER_PAGE = 20
  const totalRedemptionPages = Math.max(1, Math.ceil(myRedemptions.length / REDEMPTIONS_PER_PAGE))
  const paginatedRedemptions = myRedemptions.slice(
    (redemptionsPage - 1) * REDEMPTIONS_PER_PAGE,
    redemptionsPage * REDEMPTIONS_PER_PAGE
  )

  // Badges Modal pagination (20 per page)
  const BADGES_PER_PAGE = 20
  const totalBadgePages = Math.max(1, Math.ceil(allBadges.length / BADGES_PER_PAGE))
  const paginatedBadges = allBadges.slice((badgesPage - 1) * BADGES_PER_PAGE, badgesPage * BADGES_PER_PAGE)

  const howItWorksSlides = [
    {
      title: '1. Ganhe NexPoints Diariamente',
      icon: '⚡',
      desc: 'Ao realizar seu login diário, revisar processos operacionais, publicar artigos/estudos de caso e responder atividades de fixação, você acumula NexPoints automaticamente.',
    },
    {
      title: '2. Suba no Ranking e Conquiste Emblemas',
      icon: '🏆',
      desc: 'Seus NexPoints elevam sua patente (Bronze até Lenda) no Leaderboard corporativo e desbloqueiam emblemas exclusivos na sua galeria.',
    },
    {
      title: '3. Troque por Benefícios Reais na Loja NexP',
      icon: '🎁',
      desc: 'Utilize seus NexPoints para solicitar produtos, cursos, certificações ou experiências. A solicitação é enviada para aprovação da liderança e pode ser acompanhada em "Meus Resgates".',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="p-6 bg-gradient-to-r from-indigo-950 via-blue-900 to-slate-900 text-white border-0 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-xs font-semibold">
              <span>✨ Módulo Oficial NexP</span>
              <span>•</span>
              <span>Gamificação & Benefícios</span>
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
                onClick={() => {
                  setRedemptions(getNexPRedemptions())
                  setShowRedemptionsModal(true)
                }}
              >
                🎒 Meus Resgates ({myRedemptions.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => {
                  setHowItWorksStep(0)
                  setShowHowItWorksModal(true)
                }}
              >
                ❓ Como funciona o NexP
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Static Explanation Strip (conforme especificado na Weekly 30/05) */}
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

      {purchaseToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-sm">
          <span>{purchaseToast}</span>
          <button onClick={() => setPurchaseToast(null)} className="text-emerald-700 hover:text-emerald-950">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Daily Missions + Conquistas Recentes + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Missions (5 principais) */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">🎯 Missões Diárias (5 Principais)</h2>
              <p className="text-xs text-slate-500">
                Complete as missões de hoje para ganhar bônus extras de NexPoints
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
              const done = completedMissions.includes(mission.id)
              return (
                <div
                  key={mission.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    done ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/70 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{done ? '✅' : '🎯'}</span>
                      <h4 className={`text-sm font-bold ${done ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>
                        {mission.title}
                      </h4>
                      <Badge variant={done ? 'success' : 'info'}>+{mission.points} NexP</Badge>
                    </div>
                    <p className="text-xs text-slate-600 pl-6">{mission.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                    {done ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
                        Resgatado Hoje
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => handleCompleteMission(mission)}>
                        Resgatar +{mission.points} NexP
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditMission(mission)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-200/60 text-xs"
                          title="Editar missão"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteMission(mission.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 text-xs"
                          title="Excluir missão"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Recent Achievements (5 emblemas principais + modal de todos os emblemas) */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">🏅 Conquistas Recentes</h2>
                <p className="text-xs text-slate-500">5 emblemas em destaque na plataforma</p>
              </div>
              <button
                onClick={() => {
                  setBadgesPage(1)
                  setShowBadgesModal(true)
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                {isAdmin ? 'Gerenciar (Todos)' : 'Ver Todos'}
              </button>
            </div>

            <div className="space-y-3">
              {(allBadges.length > 0 ? allBadges.slice(0, 5) : []).map((b) => {
                const isUnlocked = earnedBadgeIds.has(b.id)
                const userBadge = userBadges.find((ub) => ub.badgeId === b.id)
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (isUnlocked && userBadge) {
                        showBadgeModal(userBadge)
                      } else {
                        setShowBadgesModal(true)
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isUnlocked
                        ? 'bg-amber-50/50 border-amber-200 hover:shadow-sm'
                        : 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                        isUnlocked ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isUnlocked ? '🏆' : '🔒'}
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
            🏆 {isAdmin ? 'Abrir Catálogo e Editar Emblemas' : 'Ver Todos os Emblemas e Como Ganhar'}
          </Button>
        </Card>
      </div>

      {/* NexP Benefits Store (5 items with lateral arrows) */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">🛍️ Loja de Benefícios NexP</h2>
            <p className="text-xs text-slate-500">
              Resgate produtos e experiências utilizando seus NexPoints. O resgate gera uma solicitação para aprovação da liderança.
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
                ◀
              </button>
              <button
                type="button"
                disabled={carouselOffset + 5 >= filteredProducts.length}
                onClick={() => setCarouselOffset((prev) => prev + 1)}
                className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                title="Próximo"
              >
                ▶
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {visibleProducts.map((product) => {
              const canAfford = currentPoints >= product.cost
              return (
                <div
                  key={product.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
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
                    <Button
                      size="sm"
                      className="w-full"
                      variant={canAfford ? 'primary' : 'outline'}
                      onClick={() => handleRedeemProduct(product)}
                    >
                      {canAfford ? '🎁 Solicitar Resgate' : `Solicitar (${product.cost} NexP)`}
                    </Button>
                    {isAdmin && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => openEditProduct(product)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          🗑️ Excluir
                        </button>
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
            <h2 className="text-lg font-bold text-slate-900">👑 Quadro de Leaderboard Corporativo</h2>
            <p className="text-xs text-slate-500">Top 20 colaboradores com maior pontuação de NexPoints</p>
          </div>
          <Badge variant="info">Seu Saldo: {currentPoints} NexP</Badge>
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
                  className={entry.userId === user?.id ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'}
                >
                  <td className="py-2.5 px-4 font-bold text-slate-700">#{entry.position || index + 1}</td>
                  <td className="py-2.5 px-4 text-slate-900">
                    {entry.userName} {entry.userId === user?.id && <Badge variant="info">Você</Badge>}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{entry.rankName}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-blue-600">{entry.totalXp} NexP</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Meus Resgates (20 por página) */}
      {showRedemptionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl p-6 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">🎒 Histórico de Resgates NexP</h3>
                <p className="text-xs text-slate-500">
                  Exibindo até 20 resgates por página com acompanhamento de aprovação da liderança
                </p>
              </div>
              <button
                onClick={() => setShowRedemptionsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-3">
              {paginatedRedemptions.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-10">
                  Nenhum resgate solicitado até o momento.
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
                          Solicitado por <strong>{r.userName}</strong> em{' '}
                          {new Date(r.createdAt).toLocaleDateString('pt-BR')} • Custo: <strong>{r.cost} NexP</strong>
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
                ✕
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
                <h3 className="text-lg font-bold text-slate-900">
                  🏅 Todos os Emblemas e Regras de Desbloqueio
                </h3>
                <p className="text-xs text-slate-500">
                  Veja como desbloquear cada conquista (exibindo até 20 emblemas por página)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button size="sm" onClick={openCreateBadge}>
                    + Novo Emblema
                  </Button>
                )}
                <button
                  onClick={() => {
                    setShowBadgesModal(false)
                    setShowBadgeForm(false)
                  }}
                  className="text-slate-400 hover:text-slate-700 text-lg px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {showBadgeForm && isAdmin && (
              <form
                onSubmit={handleSaveBadge}
                className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
              >
                <h4 className="text-sm font-bold text-slate-900">
                  {editingBadge ? 'Editar Emblema' : 'Adicionar Novo Emblema'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={badgeName}
                    onChange={(e) => setBadgeName(e.target.value)}
                    placeholder="Nome do Emblema"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                  <input
                    type="number"
                    min={0}
                    required
                    value={badgePoints}
                    onChange={(e) => setBadgePoints(Number(e.target.value))}
                    placeholder="NexPoints necessários"
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
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
                  placeholder="Descrição / Como desbloquear este emblema"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowBadgeForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    Salvar Emblema
                  </Button>
                </div>
              </form>
            )}

            <div className="flex-1 overflow-y-auto my-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paginatedBadges.map((b) => {
                const unlocked = earnedBadgeIds.has(b.id)
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                      unlocked ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          unlocked ? 'bg-amber-100' : 'bg-slate-100'
                        }`}
                      >
                        {unlocked ? '🏆' : '🔒'}
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
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBadge(b.id)}
                          className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded"
                          title="Excluir"
                        >
                          🗑️
                        </button>
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
