import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { caseStudiesApi, categoriesApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import CKEditor from '../components/CKEditor'
import ImageUploadButton from '../components/ui/ImageUploadButton'
import { showToast } from '../utils/toast'

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
  const [contentType, setContentType] = useState<number>(0) // 0: Estudo de Caso, 1: Artigo, 2: Erro Comum
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showBestPractices, setShowBestPractices] = useState(false)

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
          type: contentType,
          imageUrl: imageUrl || undefined,
        },
        token || undefined
      )

      setSuccess(true)
      showToast('Conteúdo publicado com sucesso!', {
        type: 'success',
        subtitle: `"${title}" já está disponível na Base Colaborativa.`,
      })
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
          <h2 className="text-2xl font-bold text-slate-900">Conteúdo Publicado com Sucesso!</h2>
          <p className="text-slate-600">
            Seu registro ({contentType === 1 ? 'Artigo' : contentType === 2 ? 'Erro Comum' : 'Estudo de Caso'}) já está disponível na Base de Conhecimento Colaborativa.
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Base de Conhecimento Colaborativa</p>
          <h1 className="text-3xl font-bold text-slate-900">Adicionar Novo Conteúdo</h1>
          <p className="text-slate-600 mt-1">
            Publique Estudos de Caso, Artigos Técnicos ou Erros Comuns (publicação direta sem necessidade de aprovação prévia).
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setShowBestPractices(true)}>
          📖 Boas Práticas & Modelos
        </Button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Publicação *</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value={0}>📊 Estudo de Caso (Cenário real e resultados alcançados)</option>
                <option value={1}>📄 Artigo Técnico (Guia conceitual, tutorial ou arquitetura)</option>
                <option value={2}>⚠️ Erro Comum (Causa raiz e passo a passo de resolução)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="">Selecione uma categoria</option>
                {availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">URL da Imagem de Capa (opcional)</label>
              <ImageUploadButton
                onImageUploaded={(url) => setImageUrl(url)}
                label="Fazer Upload da Capa"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... ou faça upload de uma imagem do seu computador"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {imageUrl && (
                <div className="w-12 h-10 rounded-md border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                  <img src={imageUrl} alt="Preview Capa" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
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
        <h3 className="font-semibold text-blue-900 mb-2">Orientações de Padronização por Tipo</h3>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li>• <strong>Estudo de Caso:</strong> Descreva problema real, hipóteses, solução aplicada e métricas de resultado.</li>
          <li>• <strong>Artigo Técnico:</strong> Explique conceitos, arquitetura, boas práticas ou tutoriais passo a passo.</li>
          <li>• <strong>Erro Comum:</strong> Documente o sintoma do erro, causa raiz e instruções exatas de correção.</li>
        </ul>
      </Card>

      {showBestPractices && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">📖 Boas Práticas e Diferenciação de Tipos</h3>
              <button onClick={() => setShowBestPractices(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-blue-900 text-sm mb-1">1. Estudo de Caso (Case Study)</h4>
                <p>Relato prático de um desafio enfrentado por uma equipe ou projeto. Deve conter: Contexto, Problema, Solução Implementada e Resultados Mensuráveis.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <h4 className="font-bold text-emerald-900 text-sm mb-1">2. Artigo Técnico</h4>
                <p>Conteúdo educativo ou referencial sobre ferramentas, arquitetura, padrões de código ou regras de negócio. Focado em ensinar ou documentar conhecimento técnico.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm mb-1">3. Erro Comum (Known Error)</h4>
                <p>Registro objetivo de uma falha recorrente em ambiente ou operação. Deve listar: Mensagem/Sintoma do Erro, Causa Raiz e Solução Definitiva (Workaround/Fix).</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowBestPractices(false)}>
                Entendido
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
