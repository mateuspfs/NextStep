import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { coursesApi, ranksApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

function TrainingIcon({ type }: { type: string }) {
  const icons: Record<string, JSX.Element> = {
    document: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    pencil: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    list: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  }
  return icons[type] || null
}

export default function Training() {
  const { user, token } = useAuth()
  const { badges, isLoading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState('Todos')
  const [knowledgeBase, setKnowledgeBase] = useState('Política de Privacidade 2024')
  const [activityType, setActivityType] = useState('Múltipla Escolha (Quiz)')

  const { data: courses, loading: coursesLoading } = useApi(
    () => coursesApi.getAll(token || undefined),
    [token]
  )

  const { data: leaderboard, loading: leaderboardLoading } = useApi(
    () => ranksApi.getLeaderboard(token || undefined),
    [token]
  )

  const filteredCourses = courses?.filter(course => {
    if (activeTab === 'Todos') return true
    if (activeTab === 'Quizzes') return course.level === 0
    if (activeTab === 'Abertas') return course.level === 1
    return true
  }) || []

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Central de Aprendizado</p>
          <h1 className="text-3xl font-bold text-slate-900">Atividades e Treinamentos</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">AS</div>
            <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">CM</div>
            <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">ML</div>
          </div>
          <span className="text-sm text-slate-600">12 colegas online agora</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Training Generator */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">IA Training Generator</h3>
                <p className="text-sm text-slate-500">Gere atividades personalizadas a partir de bases de conhecimento.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Base de Conhecimento</label>
                <select
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option>Política de Privacidade 2024</option>
                  <option>Guia de Estilo Editorial</option>
                  <option>Processos Internos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Atividade</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option>Múltipla Escolha (Quiz)</option>
                  <option>Perguntas Abertas</option>
                  <option>Verdadeiro ou Falso</option>
                </select>
              </div>
            </div>

            <Button className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Gerar Treinamento
            </Button>
          </Card>

          {/* Available Trainings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Treinamentos Disponíveis</h3>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {['Todos', 'Quizzes', 'Abertas'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {coursesLoading ? (
              <div className="text-center py-8 text-slate-500">Carregando treinamentos...</div>
            ) : (
              <div className="space-y-3">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <TrainingIcon type="document" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{course.title}</h4>
                        <p className="text-sm text-slate-500">
                          {course.totalLessons} lições • {course.totalXp} XP • Nível {course.level === 0 ? 'Iniciante' : course.level === 1 ? 'Intermediário' : 'Avançado'}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Global Ranking */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Ranking Global</h3>
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            {leaderboardLoading ? (
              <div className="text-center py-4 text-slate-500">Carregando ranking...</div>
            ) : (
              <div className="space-y-3">
                {leaderboard?.slice(0, 5).map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      entry.userId === user?.id ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <span className={`text-sm font-bold ${entry.position === 1 ? 'text-blue-600' : 'text-slate-500'}`}>
                      #{entry.position}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{entry.userName}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{entry.totalXp} pts</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Achievements */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Conquistas Recentes</h3>
            <div className="flex flex-wrap gap-3">
              {badges?.slice(0, 5).map((badge) => (
                <div
                  key={badge.id}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-yellow-100"
                  title={badge.badgeName}
                >
                  🏆
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
