import { useState, useEffect } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

export interface ProcessItem {
  id: number | string
  title: string
  subtitle: string
  description: string
  category: string
  author: string
  status: string
  steps?: string[]
}

const initialProcesses: ProcessItem[] = [
  {
    id: 1,
    title: 'Fluxo de Revisão Editorial',
    subtitle: 'Processo de revisão e aprovação de conteúdo editorial',
    description: 'Fluxo completo para revisão técnica, ortográfica e aprovação de conteúdos editoriais antes da publicação na plataforma.',
    category: 'Editorial',
    author: 'Ana Silva',
    status: 'Ativo',
    steps: [
      'Submissão do rascunho pelo autor',
      'Análise de conformidade e tom de voz editorial',
      'Validação técnica e revisão ortográfica',
      'Aprovação final e agendamento de publicação'
    ]
  },
  {
    id: 2,
    title: 'Pipeline de Recursos Visuais',
    subtitle: 'Pipeline de processamento e otimização de imagens',
    description: 'Processamento automatizado de imagens para compressão sem perda, geração de formatos modernos (WebP/AVIF) e padronização.',
    category: 'Técnico',
    author: 'Carlos Mendes',
    status: 'Ativo',
    steps: [
      'Upload dos ativos originais em alta resolução',
      'Validação de proporção e perfil de cor sRGB',
      'Compressão automatizada e geração de miniaturas',
      'Disponibilização na CDN'
    ]
  },
  {
    id: 3,
    title: 'Pagamento de Colaboradores',
    subtitle: 'Processo de homologação e repasse a prestadores',
    description: 'Fluxo seguro de conferência de entregas, validação fiscal e execução de repasses para contribuidores externos e especialistas.',
    category: 'Financeiro',
    author: 'Maria Santos',
    status: 'Ativo',
    steps: [
      'Recebimento e conferência da nota fiscal',
      'Validação da entrega pela gerência de área',
      'Agendamento bancário no sistema financeiro',
      'Envio do comprovante de liquidação'
    ]
  },
  {
    id: 4,
    title: 'Validação de Metadados e SEO',
    subtitle: 'Verificação de indexação e acessibilidade',
    description: 'Processo de conferência de palavras-chave, meta tags Open Graph, tags canônicas e textos alternativos para acessibilidade.',
    category: 'Técnico',
    author: 'Pedro Lima',
    status: 'Ativo',
    steps: [
      'Auditoria de tags title, description e heading hierarchy',
      'Verificação de imagens com atributo alt descritivo',
      'Teste de visualização em redes sociais (Open Graph)',
      'Validação de links canônicos e sitemap'
    ]
  },
  {
    id: 5,
    title: 'Guia Global de Estilo',
    subtitle: 'Diretrizes corporativas e padrões de design',
    description: 'Definições de design tokens, paleta de cores, tipografia e diretrizes de comunicação institucional para toda a organização.',
    category: 'Editorial',
    author: 'Lúcia Ferreira',
    status: 'Ativo',
    steps: [
      'Alinhamento com o time de Brand & Product Design',
      'Atualização no repositório de componentes e Figma',
      'Comunicação de novidades aos times de desenvolvimento',
      'Revisão periódica de aderência das interfaces'
    ]
  },
]

const categories = ['Todos', 'Editorial', 'Técnico', 'Financeiro', 'Segurança']

export default function Processes() {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [processesList, setProcessesList] = useState<ProcessItem[]>(() => {
    const saved = localStorage.getItem('nextstep_processes')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return initialProcesses
      }
    }
    return initialProcesses
  })

  const [selectedProcess, setSelectedProcess] = useState<ProcessItem | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBestPracticesModal, setShowBestPracticesModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [newCategory, setNewCategory] = useState('Editorial')
  const [newDescription, setNewDescription] = useState('')
  const [newAuthor, setNewAuthor] = useState('Colaborador Interno')

  useEffect(() => {
    localStorage.setItem('nextstep_processes', JSON.stringify(processesList))
  }, [processesList])

  const filteredProcesses = processesList.filter((process) => {
    const matchesCategory = selectedCategory === 'Todos' || process.category === selectedCategory
    const matchesSearch =
      process.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredProcesses.length / itemsPerPage))
  const paginatedProcesses = filteredProcesses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDescription.trim()) return

    const newProcess: ProcessItem = {
      id: Date.now(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Processo documentado',
      description: newDescription.trim(),
      category: newCategory,
      author: newAuthor.trim() || 'Equipe Interna',
      status: 'Ativo',
      steps: [
        'Etapa inicial de solicitação',
        'Processamento e execução operacional',
        'Revisão e homologação de qualidade'
      ]
    }

    setProcessesList([newProcess, ...processesList])
    setShowAddModal(false)
    setNewTitle('')
    setNewSubtitle('')
    setNewDescription('')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Padronização de Fluxos</p>
          <h1 className="text-3xl font-bold text-slate-900">Central de Processos</h1>
          <p className="text-slate-600 mt-1">
            Consulte os procedimentos operacionais padrão, documente novos fluxos e mantenha a consistência organizacional.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowBestPracticesModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Boas Práticas
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
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
              placeholder="Pesquisar em processos, manuais ou fluxos operacionais..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Filtrar:</span>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category)
                setCurrentPage(1)
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
          {selectedCategory !== 'Todos' || searchQuery ? (
            <button
              onClick={() => {
                setSelectedCategory('Todos')
                setSearchQuery('')
                setCurrentPage(1)
              }}
              className="ml-2 text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar Filtros
            </button>
          ) : null}
        </div>
      </div>

      {/* Process List */}
      <div className="space-y-4">
        {paginatedProcesses.map((process) => (
          <Card
            key={process.id}
            onClick={() => setSelectedProcess(process)}
            className="p-6 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {process.title}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {process.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-blue-600 mb-2">{process.subtitle}</p>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-2">{process.description}</p>
                <div className="flex items-center gap-6 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {process.category}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {process.author}
                  </span>
                  {process.steps && (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {process.steps.length} etapas
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Card>
        ))}

        {filteredProcesses.length === 0 && (
          <Card className="p-12 text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-semibold text-slate-700">Nenhum processo encontrado</p>
            <p className="text-sm mt-1">Tente buscar por outro termo ou selecione outra categoria.</p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
          </button>
        </div>
      )}

      {/* Process Detail Modal */}
      {selectedProcess && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="info">{selectedProcess.category}</Badge>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    {selectedProcess.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedProcess.title}</h2>
                <p className="text-sm font-medium text-blue-600 mt-1">{selectedProcess.subtitle}</p>
              </div>
              <button
                onClick={() => setSelectedProcess(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Descrição do Fluxo</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedProcess.description}</p>
            </div>

            {selectedProcess.steps && selectedProcess.steps.length > 0 && (
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Etapas do Procedimento</h4>
                <ol className="space-y-2">
                  {selectedProcess.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>Responsável: <strong>{selectedProcess.author}</strong></span>
              <span>Padrão Corporativo Homologado</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedProcess(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Process Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xl font-bold text-slate-900">Documentar Novo Processo</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProcess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Processo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Auditoria de Segurança Trimestral"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo / Objetivo</label>
                <input
                  type="text"
                  placeholder="Ex: Revisão periódica de acessos e conformidade"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Editorial">Editorial</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Segurança">Segurança</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Completa *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Descreva detalhadamente o fluxo operacional, critérios de entrada e saída..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar Processo</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Best Practices Modal */}
      {showBestPracticesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Guia de Boas Práticas</h3>
              </div>
              <button onClick={() => setShowBestPracticesModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-1">1. Mapeamento Claro de Etapas</h5>
                <p className="text-blue-800 text-xs leading-relaxed">
                  Todo processo deve ter gatilhos de início bem delimitados, etapas sequenciais testadas e critérios objetivos de conclusão.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <h5 className="font-semibold text-slate-900 mb-1">2. Responsabilidade e Papéis (RACI)</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Defina claramente quem é o responsável pela execução, quem aprova e quem deve ser consultado ou informado em cada etapa.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <h5 className="font-semibold text-slate-900 mb-1">3. Documentação Viva</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Evite manuais estáticos. Atualize os procedimentos sempre que houver mudanças nas ferramentas ou na legislação (como LGPD).
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <h5 className="font-semibold text-slate-900 mb-1">4. Aprendizado com Erros Conhecidos</h5>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Se um processo frequentemente gera dúvidas ou incidentes no Fórum, documente o caso na Central de Erros Conhecidos para resolução rápida.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setShowBestPracticesModal(false)}>Entendi</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
