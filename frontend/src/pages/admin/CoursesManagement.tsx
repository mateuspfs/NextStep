import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { coursesApi, categoriesApi, Course, Category } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

export default function CoursesManagement() {
  const { token } = useAuth()
  const { data: courses, loading, refetch } = useApi<Course[]>(
    () => coursesApi.getAll(token || undefined),
    [token]
  )
  const { data: categories } = useApi<Category[]>(
    () => categoriesApi.getAll(token || undefined),
    [token]
  )

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    totalLessons: 6,
    totalXp: 150,
    level: 0,
    categoryId: '',
  })

  const filteredCourses = courses?.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    const selectedCategoryId = newCourse.categoryId || categories?.[0]?.id
    if (!selectedCategoryId) {
      setError('Nenhuma categoria cadastrada. Crie uma categoria primeiro.')
      setIsSaving(false)
      return
    }

    try {
      await coursesApi.create(
        {
          title: newCourse.title.trim(),
          description: newCourse.description.trim(),
          thumbnailUrl: newCourse.thumbnailUrl.trim() || undefined,
          totalLessons: Number(newCourse.totalLessons) || 5,
          totalXp: Number(newCourse.totalXp) || 100,
          level: Number(newCourse.level),
          categoryId: selectedCategoryId,
        },
        token || undefined
      )
      setShowCreateModal(false)
      setNewCourse({
        title: '',
        description: '',
        thumbnailUrl: '',
        totalLessons: 6,
        totalXp: 150,
        level: 0,
        categoryId: '',
      })
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar treinamento')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Carregando catálogo de treinamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Administração</p>
        <h1 className="text-3xl font-bold text-slate-900">Gestão de Treinamentos e Trilhas</h1>
        <p className="text-slate-600 mt-1">
          Publique novos cursos, defina recompensas de XP e estruture o aprendizado corporativo.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar treinamento por título ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <Button
          onClick={() => {
            setNewCourse({
              title: '',
              description: '',
              thumbnailUrl: '',
              totalLessons: 6,
              totalXp: 150,
              level: 0,
              categoryId: categories?.[0]?.id || '',
            })
            setShowCreateModal(true)
          }}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Treinamento
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourses?.map((course) => (
          <Card key={course.id} className="p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge variant="info">{course.categoryName || 'Corporativo'}</Badge>
                <Badge variant={course.level === 0 ? 'success' : course.level === 1 ? 'warning' : 'error'}>
                  {course.level === 0 ? 'Iniciante' : course.level === 1 ? 'Intermediário' : 'Avançado'}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{course.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span>📚 <strong>{course.totalLessons}</strong> lições</span>
              <span className="text-blue-600 font-bold">⚡ +{course.totalXp} XP</span>
              <span>Autor: {course.authorName || 'Admin'}</span>
            </div>
          </Card>
        ))}
      </div>

      {filteredCourses?.length === 0 && (
        <Card className="p-8 text-center text-slate-500">
          Nenhum treinamento encontrado.
        </Card>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Publicar Novo Treinamento</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Curso *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arquitetura de Microsserviços e Mensageria"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explique os objetivos de aprendizado e público-alvo do curso..."
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={newCourse.categoryId}
                    onChange={(e) => setNewCourse({ ...newCourse, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nível Técnico</label>
                  <select
                    value={newCourse.level}
                    onChange={(e) => setNewCourse({ ...newCourse, level: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={0}>Iniciante</option>
                    <option value={1}>Intermediário</option>
                    <option value={2}>Avançado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total de Módulos/Lições *</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={newCourse.totalLessons}
                    onChange={(e) => setNewCourse({ ...newCourse, totalLessons: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recompensa Total (XP) *</label>
                  <input
                    type="number"
                    min={20}
                    max={1000}
                    step={10}
                    required
                    value={newCourse.totalXp}
                    onChange={(e) => setNewCourse({ ...newCourse, totalXp: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? 'Publicando...' : 'Publicar Treinamento'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
