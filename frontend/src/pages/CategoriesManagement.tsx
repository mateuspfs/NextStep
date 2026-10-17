import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { categoriesApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

interface Category {
  id: string
  name: string
  description?: string
  createdAt: string
}

export default function CategoriesManagement() {
  const { token } = useAuth()
  const { data: categories, loading, refetch } = useApi<Category[]>(
    () => categoriesApi.getAll(token || undefined),
    [token]
  )

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)

    try {
      await categoriesApi.create(newCategory, token || undefined)
      setShowCreateModal(false)
      setNewCategory({ name: '', description: '' })
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    setError('')
    setIsSaving(true)

    try {
      await categoriesApi.update(editingCategory.id, newCategory, token || undefined)
      setEditingCategory(null)
      setNewCategory({ name: '', description: '' })
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar categoria')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return

    try {
      await categoriesApi.delete(id, token || undefined)
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir categoria')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Carregando categorias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Administração</p>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Categorias</h1>
          <p className="text-slate-600 mt-1">Gerencie as categorias disponíveis para estudos de caso e conteúdos.</p>
        </div>
        <Button onClick={() => { setNewCategory({ name: '', description: '' }); setShowCreateModal(true) }}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Categoria
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-900">{category.name}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingCategory(category)
                    setNewCategory({ name: category.name, description: category.description || '' })
                  }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            {category.description && (
              <p className="text-sm text-slate-600 mb-3">{category.description}</p>
            )}
            <p className="text-xs text-slate-400">
              Criada em {new Date(category.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </Card>
        ))}
      </div>

      {categories?.length === 0 && (
        <Card className="p-8 text-center text-slate-500">
          Nenhuma categoria cadastrada
        </Card>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCategory) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingCategory(null)
                  setNewCategory({ name: '', description: '' })
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={editingCategory ? handleUpdate : handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingCategory(null)
                    setNewCategory({ name: '', description: '' })
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
