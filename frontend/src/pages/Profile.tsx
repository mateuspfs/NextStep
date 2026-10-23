import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { badgesApi, ranksApi, Badge as BadgeType, Rank as RankType } from '../services/api'
import { useApi } from '../hooks/useApi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'

export default function Profile() {
  const { user, token, logout } = useAuth()
  const { stats, rank, badges: userBadges, courses: userCourses, isLoading } = useUser()
  const navigate = useNavigate()

  const { data: allBadges } = useApi<BadgeType[]>(
    () => badgesApi.getAll(token || undefined),
    [token]
  )

  const { data: allRanks } = useApi<RankType[]>(
    () => ranksApi.getAll(token || undefined),
    [token]
  )

  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'courses' | 'settings'>('overview')
  const [notifForum, setNotifForum] = useState(true)
  const [notifProcesses, setNotifProcesses] = useState(true)
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Carregando seu perfil...</p>
        </div>
      </div>
    )
  }

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId))
  const completedCourses = userCourses.filter((c) => c.isCompleted)
  const inProgressCourses = userCourses.filter((c) => !c.isCompleted)

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Top Profile Banner */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-0 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-md border-2 border-white/20">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-2xl font-bold text-white">{user?.fullName}</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200">
                  {user?.role === 'Admin' ? 'Administrador' : 'Colaborador'}
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-3">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                  🏆 Rank: <strong>{rank?.rankName || 'Bronze'}</strong>
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                  ⚡ Nível: <strong>{stats?.currentLevel || 1}</strong>
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                  🔥 Ofensiva: <strong>{stats?.currentStreak || 1} dias</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[240px] border border-white/10">
            <div className="flex items-center justify-between text-xs text-slate-200 mb-1.5">
              <span>Experiência Total</span>
              <span className="font-bold text-amber-300">{stats?.totalXp || 0} XP</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    stats ? ((stats.totalXp % 100) / 100) * 100 || 35 : 35
                  )}%`
                }}
              />
            </div>
            <p className="text-[11px] text-slate-300">
              Faltam <strong>{stats?.xpToNextLevel || 65} XP</strong> para alcançar o Nível {(stats?.currentLevel || 1) + 1}
            </p>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'overview', label: 'Visão Geral & Carreira' },
          { id: 'badges', label: `Conquistas (${userBadges.length})` },
          { id: 'courses', label: `Meus Treinamentos (${userCourses.length})` },
          { id: 'settings', label: 'Preferências da Conta' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <p className="text-xs font-medium text-slate-500 uppercase">XP Acumulado</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalXp || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Nível {stats?.currentLevel || 1} na plataforma</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium text-slate-500 uppercase">Cursos Concluídos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.coursesCompleted || completedCourses.length}</p>
              <p className="text-xs text-green-600 mt-1">{inProgressCourses.length} em andamento</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium text-slate-500 uppercase">Emblemas Desbloqueados</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.badgesEarned || userBadges.length}</p>
              <p className="text-xs text-purple-600 mt-1">De {allBadges?.length || 8} disponíveis</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-medium text-slate-500 uppercase">Recorde de Ofensiva</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.longestStreak || 7} dias</p>
              <p className="text-xs text-orange-600 mt-1">Atual: {stats?.currentStreak || 1} dias seguidos</p>
            </Card>
          </div>

          {/* Career Progression / Ranks */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Trilha de Evolução de Ranks</h3>
                <p className="text-sm text-slate-500">Acumule XP completando treinamentos, documentando processos e ajudando colegas no Fórum.</p>
              </div>
              <Badge variant="info">Seu Rank: {rank?.rankName || 'Bronze'}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-4">
              {(allRanks && allRanks.length > 0
                ? allRanks
                : [
                    { id: '1', name: 'Bronze', minPoints: 0, maxPoints: 499, color: '#CD7F32', position: 1, description: 'Iniciante', iconUrl: '' },
                    { id: '2', name: 'Prata', minPoints: 500, maxPoints: 1499, color: '#94A3B8', position: 2, description: 'Intermediário', iconUrl: '' },
                    { id: '3', name: 'Ouro', minPoints: 1500, maxPoints: 3499, color: '#EAB308', position: 3, description: 'Experiente', iconUrl: '' },
                    { id: '4', name: 'Platina', minPoints: 3500, maxPoints: 6999, color: '#38BDF8', position: 4, description: 'Engajado', iconUrl: '' },
                    { id: '5', name: 'Diamante', minPoints: 7000, maxPoints: 9999, color: '#6366F1', position: 5, description: 'Especialista', iconUrl: '' },
                    { id: '6', name: 'Lenda', minPoints: 10000, maxPoints: 999999, color: '#EF4444', position: 6, description: 'Referência', iconUrl: '' },
                  ]
              ).map((r) => {
                const currentXp = stats?.totalXp || 0
                const isCurrent = rank?.rankName === r.name || (currentXp >= r.minPoints && currentXp <= r.maxPoints)
                const isUnlocked = currentXp >= r.minPoints
                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                        : isUnlocked
                        ? 'bg-white border-green-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: r.color || '#3B82F6' }}
                    >
                      {r.position}º
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{r.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{r.minPoints}+ XP</p>
                    {isCurrent && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                        ATUAL
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Galeria de Conquistas e Emblemas</h3>
          <p className="text-sm text-slate-500 mb-6">
            Emblemas reconhecem sua participação ativa no ecossistema corporativo NextStep.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(allBadges && allBadges.length > 0 ? allBadges : []).map((badge) => {
              const unlocked = earnedBadgeIds.has(badge.id) || (stats?.totalXp || 0) >= badge.requiredPoints
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border transition-all ${
                    unlocked
                      ? 'bg-amber-50/40 border-amber-200 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${unlocked ? 'bg-amber-100' : 'bg-slate-200'}`}>
                      {unlocked ? '🏆' : '🔒'}
                    </div>
                    <Badge variant={unlocked ? 'success' : 'default'}>
                      {unlocked ? 'Desbloqueado' : `${badge.requiredPoints} XP`}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{badge.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{badge.description}</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {userCourses.length > 0 ? (
            userCourses.map((uc) => (
              <Card key={uc.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">{uc.courseTitle}</h4>
                    <Badge variant={uc.isCompleted ? 'success' : 'info'}>
                      {uc.isCompleted ? 'Concluído' : 'Em Andamento'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {uc.completedLessons} de {uc.totalLessons} lições concluídas • Iniciado em{' '}
                    {new Date(uc.startedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="pt-2 max-w-md">
                    <ProgressBar value={uc.progressPercentage} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">{uc.progressPercentage}%</span>
                  <Button size="sm" variant="outline" onClick={() => navigate('/training')}>
                    Ir para Treinamento
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-slate-600 font-medium">Você ainda não iniciou nenhum treinamento.</p>
              <Button className="mt-4" onClick={() => navigate('/training')}>
                Explorar Treinamentos
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card className="p-6 max-w-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Preferências e Notificações</h3>
          <p className="text-sm text-slate-500 mb-6">
            Personalize como você recebe alertas de novos fluxos, respostas no fórum e relatórios semanais.
          </p>

          <form onSubmit={handleSavePreferences} className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-900">Alertas do Fórum e Erros Conhecidos</p>
                <p className="text-xs text-slate-500">Notificar quando uma dúvida minha receber resposta ou solução validada</p>
              </div>
              <input
                type="checkbox"
                checked={notifForum}
                onChange={(e) => setNotifForum(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-900">Atualizações na Central de Processos</p>
                <p className="text-xs text-slate-500">Receber avisos quando processos operacionais forem homologados ou revisados</p>
              </div>
              <input
                type="checkbox"
                checked={notifProcesses}
                onChange={(e) => setNotifProcesses(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-slate-900">Resumo Semanal de Evolução (XP & Ranking)</p>
                <p className="text-xs text-slate-500">Receber resumo de desempenho e posição no ranking corporativo</p>
              </div>
              <input
                type="checkbox"
                checked={notifWeeklyReport}
                onChange={(e) => setNotifWeeklyReport(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>

            {savedSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs font-medium text-green-800">
                ✅ Preferências salvas com sucesso!
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={logout}>
                Encerrar Sessão
              </Button>
              <Button type="submit">Salvar Preferências</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
