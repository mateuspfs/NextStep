import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { caseStudiesApi } from '../services/api'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import CKEditor from '../components/CKEditor'

export default function SubmitCaseStudy() {
  const navigate = useNavigate()
  const { token } = useAuth()

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
      setTimeout(() => navigate('/knowledge'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar estudo de caso')
      setSuccess(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Estudo de Caso Enviado!</h2>
          <p className="text-slate-600">
            Seu estudo de caso foi enviado para aprovação. Você será notificado quando for aprovado.
          </p>
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
          Compartilhe seu conhecimento e experiência com a equipe. Seu estudo de caso será revisado por um administrador antes de ser publicado.
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo</label>
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
              <option value="a1b2c3d4-0000-0000-0000-000000000001">Marketing</option>
              <option value="a1b2c3d4-0000-0000-0000-000000000002">Técnico</option>
              <option value="a1b2c3d4-0000-0000-0000-000000000003">Segurança</option>
              <option value="a1b2c3d4-0000-0000-0000-000000000004">Recursos Humanos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem (opcional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo *</label>
            <CKEditor
              value={content}
              onChange={setContent}
              placeholder="Descreva seu estudo de caso detalhadamente..."
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
                {isSubmitting ? 'Enviando...' : 'Enviar para Aprovação'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Guidelines */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Dicas para um bom estudo de caso</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Descreva o problema ou situação inicial</li>
          <li>• Explique as ações tomadas e os resultados obtidos</li>
          <li>• Inclua aprendizados e recomendações</li>
          <li>• Use exemplos concretos e dados quando possível</li>
        </ul>
      </Card>
    </div>
  )
}
