import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../contexts/UserContext'
import { coursesApi, ranksApi, Course } from '../services/api'
import { useApi } from '../hooks/useApi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

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

interface GeneratedActivity {
  title: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export default function Training() {
  const { user, token } = useAuth()
  const { badges, isLoading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState('Todos')
  const [knowledgeBase, setKnowledgeBase] = useState('Política de Privacidade 2024')
  const [activityType, setActivityType] = useState('Múltipla Escolha (Quiz)')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedActivity, setGeneratedActivity] = useState<GeneratedActivity | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  const { data: courses, loading: coursesLoading } = useApi(
    () => coursesApi.getAll(token || undefined),
    [token]
  )

  const { data: leaderboard, loading: leaderboardLoading } = useApi(
    () => ranksApi.getLeaderboard(token || undefined),
    [token]
  )

  const fallbackCourses: Course[] = [
    {
      id: 'c1',
      title: 'Fundamentos de Segurança e LGPD',
      description: 'Aprenda os princípios fundamentais da Lei Geral de Proteção de Dados e segurança da informação aplicados ao dia a dia.',
      totalLessons: 6,
      totalXp: 120,
      level: 0,
      categoryId: 'seg',
      categoryName: 'Segurança',
      authorId: 'u1',
      authorName: 'Equipe de Compliance',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c2',
      title: 'Boas Práticas de Integrações de API',
      description: 'Como lidar com autenticação segura, rate limits e tratamento de erros conhecidos em integrações.',
      totalLessons: 8,
      totalXp: 180,
      level: 1,
      categoryId: 'tec',
      categoryName: 'Tecnologia',
      authorId: 'u2',
      authorName: 'Arquitetura de Software',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c3',
      title: 'Comunicação e Redação Editorial',
      description: 'Técnicas para produção de manuais, artigos e documentação clara e padronizada para os times.',
      totalLessons: 5,
      totalXp: 100,
      level: 0,
      categoryId: 'ed',
      categoryName: 'Editorial',
      authorId: 'u3',
      authorName: 'Comunicação Interna',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  const displayCourses = (courses && courses.length > 0) ? courses : fallbackCourses

  const filteredCourses = displayCourses.filter((course) => {
    if (activeTab === 'Todos') return true
    if (activeTab === 'Quizzes') return course.level === 0
    if (activeTab === 'Abertas') return course.level >= 1
    return true
  })

  const handleGenerateTraining = () => {
    setIsGenerating(true)
    setGeneratedActivity(null)
    setSelectedOption(null)
    setHasAnswered(false)

    setTimeout(() => {
      setIsGenerating(false)
      setGeneratedActivity({
        title: `Atividade Prática: ${knowledgeBase}`,
        question: `De acordo com as diretrizes de "${knowledgeBase}", qual é a conduta padrão exigida para incidentes de acesso não autorizado ou erro de validação?`,
        options: [
          'Ignorar temporariamente se não houver impacto imediato percebido.',
          'Notificar imediatamente o time de segurança/DPO e registrar o incidente na central de erros conhecidos.',
          'Reiniciar o servidor sem guardar logs de auditoria.',
          'Excluir a conta do usuário envolvido sem notificação.'
        ],
        correctIndex: 1,
        explanation: 'Correto! A resposta em conformidade exige notificação imediata aos responsáveis e documentação de logs para prevenção e compliance.'
      })
    }, 900)
  }

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
          <p className="text-slate-600 mt-1">Aprimore suas competências, realize quizzes interativos e ganhe pontos de experiência.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">AS</div>
            <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">CM</div>
            <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">ML</div>
          </div>
          <span className="text-sm text-slate-600 font-medium">12 colegas online agora</span>
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
                <h3 className="text-lg font-semibold text-slate-900">Gerador de Treinamentos com IA</h3>
                <p className="text-sm text-slate-500">Crie desafios e perguntas personalizadas a partir dos documentos internos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Base de Conhecimento</label>
                <select
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option>Política de Privacidade 2024</option>
                  <option>Guia de Estilo Editorial</option>
                  <option>Processos Internos e LGPD</option>
                  <option>Resolução de Erros de APIs</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Atividade</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option>Múltipla Escolha (Quiz)</option>
                  <option>Perguntas Abertas</option>
                  <option>Verdadeiro ou Falso</option>
                </select>
              </div>
            </div>

            <Button className="w-full" onClick={handleGenerateTraining} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sintetizando treinamento com IA...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Gerar Treinamento
                </>
              )}
            </Button>

            {/* Generated Activity Interactive Box */}
            {generatedActivity && (
              <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <Badge variant="info">Atividade Gerada</Badge>
                  <span className="text-xs font-bold text-blue-700">+35 XP</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{generatedActivity.title}</h4>
                  <p className="text-sm text-slate-700 font-medium">{generatedActivity.question}</p>
                </div>
                <div className="space-y-2">
                  {generatedActivity.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => !hasAnswered && setSelectedOption(idx)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-3 rounded-lg text-sm border transition-all ${
                        selectedOption === idx
                          ? hasAnswered
                            ? idx === generatedActivity.correctIndex
                              ? 'bg-green-100 border-green-400 text-green-900 font-medium'
                              : 'bg-red-100 border-red-400 text-red-900'
                            : 'bg-blue-100 border-blue-400 text-blue-900 font-medium'
                          : hasAnswered && idx === generatedActivity.correctIndex
                          ? 'bg-green-100 border-green-400 text-green-900 font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold mr-2">{String.fromCharCode(65 + idx)})</span>
                      {option}
                    </button>
                  ))}
                </div>

                {!hasAnswered ? (
                  <Button
                    className="w-full"
                    disabled={selectedOption === null}
                    onClick={() => setHasAnswered(true)}
                  >
                    Confirmar Resposta
                  </Button>
                ) : (
                  <div className="p-3 bg-white border rounded-lg text-xs space-y-1">
                    <p className={`font-semibold ${selectedOption === generatedActivity.correctIndex ? 'text-green-700' : 'text-red-700'}`}>
                      {selectedOption === generatedActivity.correctIndex ? '🎉 Resposta Correta! Você ganhou +35 XP.' : '❌ Incorreto. Veja o gabarito comentado:'}
                    </p>
                    <p className="text-slate-600">{generatedActivity.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Available Trainings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Treinamentos Disponíveis</h3>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {[
                  { id: 'Todos', label: 'Todos' },
                  { id: 'Quizzes', label: 'Quizzes' },
                  { id: 'Abertas', label: 'Abertas' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {coursesLoading ? (
              <div className="text-center py-8 text-slate-500">Carregando treinamentos...</div>
            ) : (
              <div className="space-y-3">
                {filteredCourses.map((course) => (
                  <Card
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className="p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <TrainingIcon type="document" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {course.totalLessons} lições • {course.totalXp} XP • Nível {course.level === 0 ? 'Iniciante' : course.level === 1 ? 'Intermediário' : 'Avançado'}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <h3 className="text-lg font-semibold text-slate-900">Ranking Geral</h3>
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            {leaderboardLoading ? (
              <div className="text-center py-4 text-slate-500">Carregando ranking...</div>
            ) : (
              <div className="space-y-3">
                {leaderboard && leaderboard.length > 0 ? (
                  leaderboard.slice(0, 5).map((entry) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        entry.userId === user?.id ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <span className={`text-sm font-bold w-6 ${entry.position === 1 ? 'text-amber-500' : entry.position === 2 ? 'text-slate-400' : entry.position === 3 ? 'text-amber-700' : 'text-slate-500'}`}>
                        #{entry.position}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{entry.userName}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{entry.totalXp} pts</span>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    {[
                      { name: 'Ana Silva', pts: 1250, pos: 1 },
                      { name: 'Carlos Mendes', pts: 980, pos: 2 },
                      { name: 'Rodrigo Alencar', pts: 840, pos: 3 },
                      { name: user?.fullName || 'Você', pts: 520, pos: 4 },
                    ].map((entry) => (
                      <div key={entry.pos} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                        <span className={`text-sm font-bold w-6 ${entry.pos === 1 ? 'text-amber-500' : 'text-slate-500'}`}>
                          #{entry.pos}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{entry.name}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">{entry.pts} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Recent Achievements */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Conquistas e Emblemas</h3>
            <div className="flex flex-wrap gap-3">
              {badges && badges.length > 0 ? (
                badges.slice(0, 5).map((badge) => (
                  <div
                    key={badge.id}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-amber-50 border border-amber-200 shadow-sm"
                    title={badge.badgeName}
                  >
                    🏆
                  </div>
                ))
              ) : (
                ['🏆 Primeiro Treinamento', '⭐ Mestre em Processos', '⚡ Ofensiva 7 Dias', '💡 Colaborador Ativo'].map((badgeName, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 w-full"
                  >
                    <span className="text-base">{badgeName.split(' ')[0]}</span>
                    <span>{badgeName.substring(2)}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="info" className="mb-2">
                  {selectedCourse.level === 0 ? 'Nível Iniciante' : selectedCourse.level === 1 ? 'Nível Intermediário' : 'Nível Avançado'}
                </Badge>
                <h3 className="text-xl font-bold text-slate-900">{selectedCourse.title}</h3>
                <p className="text-xs text-slate-500 mt-1">Autor: {selectedCourse.authorName}</p>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">
              {selectedCourse.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <span className="block text-xl font-bold text-blue-700">{selectedCourse.totalLessons}</span>
                <span className="text-xs text-blue-600">Módulos / Lições</span>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <span className="block text-xl font-bold text-green-700">+{selectedCourse.totalXp} XP</span>
                <span className="text-xs text-green-600">Recompensa</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setSelectedCourse(null)}>
                Fechar
              </Button>
              <Button onClick={() => {
                alert(`Iniciando o treinamento: ${selectedCourse.title}! Bons estudos.`)
                setSelectedCourse(null)
              }}>
                Acessar Conteúdo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
