import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { caseStudiesApi, categoriesApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import CKEditor from '../components/CKEditor'

const fallbackCategories = [
  { id: 'cat-1', name: 'Tecnologia & DevOps' },
  { id: 'cat-2', name: 'Marketing' },
  { id: 'cat-3', name: 'Integrações' },
  { id: 'cat-4', name: 'Editorial' },
  { id: 'cat-5', name: 'Recursos Humanos' },
  { id: 'cat-6', name: 'Segurança & Compliance' },
]

export default function SubmitCaseStudy() {
  const navigate = useNavigate()
  const { token } = useAuth()
  
  const { data: categories } = useApi(
    () => categoriesApi.getAll(token || undefined),
    [token]
  )

  const availableCategories = (categories && categories.length > 0) ? categories : fallbackCategories

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await caseStudiesApi.submit(
        {
          title,
          subtitle,
          content,
          categoryId,
          imageUrl: imageUrl || undefined,
        },
        token || undefined
      )

      setSuccess(true)
      setTimeout(() => navigate('/knowledge'), 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar estudo de caso')
      setSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Estudo de Caso Enviado com Sucesso!</h2>
          <p className="text-slate-600">
            Seu estudo de caso foi registrado e já está integrado à Base de Conhecimento Colaborativa.
          </p>
          <div className="pt-2">
            <Button onClick={() => navigate('/knowledge')}>Ir para a Base de Conhecimento</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Base de Conhecimento</p>
        <h1 className="text-3xl font-bold text-slate-900">Submeter Estudo de Caso</h1>
        <p className="text-slate-600 mt-1">
          Compartilhe aprendizados, arquiteturas e soluções implementadas com toda a equipe da organização.
        </p>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título do Estudo *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reestruturação da Campanha Q4"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo / Objetivo</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ex: Superando o Burnout Criativo"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Selecione uma categoria</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem de Capa (opcional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo e Detalhamento Técnico *</label>
            <CKEditor
              value={content}
              onChange={setContent}
              placeholder="Descreva o contexto, o problema identificado, a solução desenvolvida e os resultados mensurados..."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              * Campos obrigatórios
            </p>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/knowledge')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Salvar e Publicar Estudo'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Guidelines */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Orientações para um bom estudo de caso</h3>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li>• Descreva o problema ou situação inicial com clareza</li>
          <li>• Explique as hipóteses levantadas e a tomada de decisão</li>
          <li>• Detalhe ferramentas, tecnologias ou processos adotados</li>
          <li>• Inclua métricas de sucesso, aprendizados e recomendações futuras</li>
        </ul>
      </Card>
    </div>
  )
}
