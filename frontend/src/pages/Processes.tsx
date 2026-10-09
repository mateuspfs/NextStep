import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const categories = ['Todos', 'Editorial', 'Técnico', 'Segurança']

const processes = [
  {
    id: 1,
    title: 'Draft Review Flow',
    subtitle: 'Processo de revisão de conteúdo editorial',
    description: 'Fluxo completo para revisão e aprovação de conteúdos editoriais antes da publicação.',
    category: 'Editorial',
    author: 'Ana Silva',
    status: 'Ativo',
  },
  {
    id: 2,
    title: 'Image Asset Pipeline',
    subtitle: 'Pipeline de processamento de imagens',
    description: 'Processamento automatizado de imagens para otimização e entrega em múltiplos formatos.',
    category: 'Técnico',
    author: 'Carlos Mendes',
    status: 'Ativo',
  },
  {
    id: 3,
    title: 'Contributor Payouts',
    subtitle: 'Processo de pagamento de contribuidores',
    description: 'Fluxo de aprovação e execução de pagamentos para contribuidores externos.',
    category: 'Financeiro',
    author: 'Maria Santos',
    status: 'Ativo',
  },
  {
    id: 4,
    title: 'SEO Meta Verification',
    subtitle: 'Verificação de meta tags SEO',
    description: 'Processo de verificação e validação de meta tags SEO antes da publicação.',
    category: 'Técnico',
    author: 'Pedro Lima',
    status: 'Ativo',
  },
  {
    id: 5,
    title: 'Global Style Guide',
    subtitle: 'Guia de estilo global',
    description: 'Definições de estilo e padrões visuais para toda a organização.',
    category: 'Editorial',
    author: 'Lucia Ferreira',
    status: 'Ativo',
  },
]

export default function Processes() {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProcesses = processes.filter((process) => {
    const matchesCategory = selectedCategory === 'Todos' || process.category === selectedCategory
    const matchesSearch = process.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          process.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Padronização de Fluxos</p>
          <h1 className="text-3xl font-bold text-slate-900">Central de Processos</h1>
          <p className="text-slate-600 mt-1">Explore aprendizados, documente experiências e construa a memória técnica da nossa organização.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Boas Práticas
          </Button>
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Processo
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar em processos, manuais ou erros conhecidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Filtrar:</span>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
          <button className="ml-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Process List */}
      <div className="space-y-4">
        {filteredProcesses.map((process) => (
          <Card key={process.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">{process.title}</h3>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">{process.status}</span>
                </div>
                <p className="text-sm text-blue-600 mb-2">{process.subtitle}</p>
                <p className="text-slate-600 mb-3">{process.description}</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {process.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {process.author}
                  </span>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Anterior</button>
        <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">1</button>
        <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">2</button>
        <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">3</button>
        <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Próximo</button>
      </div>
    </div>
  )
}
