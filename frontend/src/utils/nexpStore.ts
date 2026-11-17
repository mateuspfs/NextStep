// Shared storage & helpers for NexP Gamification, Redemptions, Daily Missions, Likes/Dislikes, and Admin Dashboard Customization

export interface NexPProduct {
  id: string
  title: string
  description: string
  cost: number
  imageUrl: string
  category: string
  stock: number
}

export interface NexPRedemption {
  id: string
  productId: string
  productTitle: string
  productDescription: string
  productImageUrl: string
  cost: number
  userId: string
  userName: string
  userEmail: string
  userPhoto?: string
  userPoints: number
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
}

export interface DailyMission {
  id: string
  title: string
  description: string
  points: number
  criteriaKey: string
}

const PRODUCTS_KEY = 'nextstep_nexp_products_v1'
const REDEMPTIONS_KEY = 'nextstep_nexp_redemptions_v1'
const MISSIONS_KEY = 'nextstep_nexp_missions_v1'
const COMPLETED_MISSIONS_KEY = 'nextstep_nexp_completed_missions_v1'
const LIKES_KEY = 'nextstep_item_votes_v1'
const DASHBOARD_CONFIG_KEY = 'nextstep_dashboard_config_v1'
const ACTIVITY_INSIGHTS_KEY = 'nextstep_activity_insights_v1'

export const defaultNexPProducts: NexPProduct[] = [
  {
    id: 'prod-1',
    title: 'Kit Onboarding Premium NextStep',
    description: 'Mochila executiva impermeável, caderno inteligente e garrafa térmica inox com gravação a laser.',
    cost: 800,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    category: 'Kits & Vestuário',
    stock: 15,
  },
  {
    id: 'prod-2',
    title: 'Headset Bluetooth Noise Cancelling',
    description: 'Fone supra-auricular sem fio com cancelamento ativo de ruído para máxima concentração no trabalho.',
    cost: 2200,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    category: 'Tecnologia',
    stock: 5,
  },
  {
    id: 'prod-3',
    title: 'Vale-Curso / Certificação Técnica',
    description: 'subsídio integral para certificação oficial AWS, Microsoft Azure ou curso de especialização à sua escolha.',
    cost: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    category: 'Educação',
    stock: 20,
  },
  {
    id: 'prod-4',
    title: 'Day-Off de Aniversário Estendido',
    description: 'Um dia extra de folga remunerada para aproveitar com a família (mediante alinhamento com a liderança).',
    cost: 3000,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    category: 'Experiências',
    stock: 10,
  },
  {
    id: 'prod-5',
    title: 'Vale Gastronômico / Gift Card R$ 150',
    description: 'Crédito digital para utilização em aplicativos de delivery, cafeterias parceiras ou livrarias.',
    cost: 1000,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    category: 'Experiências',
    stock: 25,
  },
]

export const defaultDailyMissions: DailyMission[] = [
  {
    id: 'mission-login',
    title: 'Check-in Diário na Plataforma',
    description: 'Realize seu acesso diário para manter sua ofensiva ativa e acompanhar novidades.',
    points: 20,
    criteriaKey: 'daily_login',
  },
  {
    id: 'mission-process',
    title: 'Revisar um Processo Operacional',
    description: 'Abra e leia na íntegra qualquer documento homologado na Central de Processos.',
    points: 35,
    criteriaKey: 'read_process',
  },
  {
    id: 'mission-kb',
    title: 'Avaliar Conteúdo na Base Colaborativa',
    description: 'Contribua com feedback (Like) em um Estudo de Caso, Artigo ou Erro Comum.',
    points: 30,
    criteriaKey: 'vote_kb',
  },
  {
    id: 'mission-quiz',
    title: 'Responder 1 Atividade de Fixação',
    description: 'Conclua uma atividade técnica no Painel de Atividades com aproveitamento.',
    points: 50,
    criteriaKey: 'complete_activity',
  },
  {
    id: 'mission-share',
    title: 'Compartilhar Conhecimento ou Solução',
    description: 'Publique um artigo, erro comum, estudo de caso ou responda no Fórum.',
    points: 75,
    criteriaKey: 'share_content',
  },
]

export function getNexPProducts(): NexPProduct[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaultNexPProducts))
  return defaultNexPProducts
}

export function saveNexPProducts(products: NexPProduct[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
}

export function getNexPRedemptions(): NexPRedemption[] {
  try {
    const raw = localStorage.getItem(REDEMPTIONS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

export function saveNexPRedemptions(redemptions: NexPRedemption[]): void {
  localStorage.setItem(REDEMPTIONS_KEY, JSON.stringify(redemptions))
}

export function getDailyMissions(): DailyMission[] {
  try {
    const raw = localStorage.getItem(MISSIONS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(defaultDailyMissions))
  return defaultDailyMissions
}

export function saveDailyMissions(missions: DailyMission[]): void {
  localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions))
}

export function getCompletedMissionsToday(userId: string): string[] {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = localStorage.getItem(`${COMPLETED_MISSIONS_KEY}_${userId}_${today}`)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return []
}

export function markMissionCompletedToday(userId: string, missionId: string): string[] {
  const today = new Date().toISOString().slice(0, 10)
  const current = getCompletedMissionsToday(userId)
  if (!current.includes(missionId)) {
    const updated = [...current, missionId]
    localStorage.setItem(`${COMPLETED_MISSIONS_KEY}_${userId}_${today}`, JSON.stringify(updated))
    return updated
  }
  return current
}

// Likes & Dislikes system for Processes and Knowledge Base items
export interface ItemVoteData {
  likes: number
  dislikes: number
  userVote?: 'like' | 'dislike' | null
}

export function getAllItemVotes(): Record<string, ItemVoteData> {
  try {
    const raw = localStorage.getItem(LIKES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {}
}

export function getItemVote(itemId: string, defaultLikes = 8, defaultDislikes = 0): ItemVoteData {
  const all = getAllItemVotes()
  if (all[itemId]) return all[itemId]
  // Deterministic seed based on itemId characters
  let hash = 0
  for (let i = 0; i < itemId.length; i++) {
    hash = (hash + itemId.charCodeAt(i)) % 19
  }
  return {
    likes: defaultLikes + hash,
    dislikes: defaultDislikes,
    userVote: null,
  }
}

export function toggleItemVote(itemId: string, type: 'like' | 'dislike'): ItemVoteData {
  const all = getAllItemVotes()
  const current = getItemVote(itemId)
  let { likes, dislikes, userVote } = current

  if (userVote === type) {
    if (type === 'like') likes = Math.max(0, likes - 1)
    else dislikes = Math.max(0, dislikes - 1)
    userVote = null
  } else {
    if (userVote === 'like') likes = Math.max(0, likes - 1)
    if (userVote === 'dislike') dislikes = Math.max(0, dislikes - 1)
    if (type === 'like') likes += 1
    else dislikes += 1
    userVote = type
  }

  const updated: ItemVoteData = { likes, dislikes, userVote }
  all[itemId] = updated
  localStorage.setItem(LIKES_KEY, JSON.stringify(all))
  return updated
}

// Dashboard configuration for Admin (featured process & top 5 processes)
export interface DashboardConfig {
  featuredProcessId?: string
  mainProcessIds?: string[]
}

export function getDashboardConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(DASHBOARD_CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return {}
}

export function saveDashboardConfig(config: DashboardConfig): void {
  localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(config))
}

// Activity Insights saved by Admin via AI
export interface SavedActivityInsight {
  id: string
  activityTitle: string
  userName?: string
  insightText: string
  wrongQuestionsSummary: string[]
  createdAt: string
}

export function getSavedActivityInsights(): SavedActivityInsight[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_INSIGHTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return [
    {
      id: 'insight-default-1',
      activityTitle: 'Validação de Metadados, SEO e Segurança',
      userName: 'Equipe Geral',
      insightText:
        'Análise de IA identificou que 42% dos colaboradores confundem a ordem de aplicação de tags canônicas e isolamento de credenciais em incidentes LGPD. Recomenda-se reforço prático com atividade focada nesses dois tópicos.',
      wrongQuestionsSummary: [
        'Qual é o primeiro passo obrigatório ao identificar vazamento de credencial?',
        'Como configurar corretamente a tag canonical em artigos duplicados?',
      ],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ]
}

export function saveActivityInsight(insight: SavedActivityInsight): SavedActivityInsight[] {
  const current = getSavedActivityInsights()
  const updated = [insight, ...current]
  localStorage.setItem(ACTIVITY_INSIGHTS_KEY, JSON.stringify(updated))
  return updated
}
