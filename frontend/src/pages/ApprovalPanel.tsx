import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

interface CaseStudy {
  id: string
  title: string
  subtitle: string
  content: string
  category: string
  author: string
  authorAvatar: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  imageUrl?: string
}

const mockCaseStudies: CaseStudy[] = [
  {
    id: '1',
    title: 'Reestruturação da Campanha Q4: Superando o Burnout Criativo',
    subtitle: 'Como o time de criação pivotou a estratégia após 3 semanas de estagnação',
    content: '<p>Uma análise detalhada sobre como o time de criação pivotou a estratégia após 3 semanas de estagnação...</p>',
    category: 'Marketing',
    author: 'Marcos Lima',
    authorAvatar: 'ML',
    submittedAt: '2024-10-08',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Migração de Servidores: Minimizando o Downtime Crítico',
    subtitle: 'Protocolos estabelecidos durante a transição de infraestrutura',
    content: '<p>Protocolos estabelecidos durante a transição de infraestrutura que garantiram 99.9% de disponibilidade...</p>',
    category: 'Técnico',
    author: 'Carla Mendes',
    authorAvatar: 'CM',
    submittedAt: '2024-10-07',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Implementação de Segurança Zero Trust',
    subtitle: 'Nova abordagem de segurança implementada na empresa',
    content: '<p>A implementação de uma abordagem Zero Trust mudou completamente a forma como lidamos com segurança...</p>',
    category: 'Segurança',
    author: 'Pedro Lima',
    authorAvatar: 'PL',
    submittedAt: '2024-10-06',
    status: 'pending',
  },
]

export default function ApprovalPanel() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(mockCaseStudies)
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const filteredCases = caseStudies.filter(cs => filter === 'all' || cs.status === filter)

  const handleApprove = (id: string) => {
    setCaseStudies(prev => prev.map(cs => cs.id === id ? { ...cs, status: 'approved' } : cs))
    setSelectedCase(null)
  }

  const handleReject = (id: string) => {
    setCaseStudies(prev => prev.map(cs => cs.id === id ? { ...cs, status: 'rejected' } : cs))
    setSelectedCase(null)
  }

  const pendingCount = caseStudies.filter(cs => cs.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Administração</p>
          <h1 className="text-3xl font-bold text-slate-900">Aprovação de Estudos de Caso</h1>
          <p className="text-slate-600 mt-1">Revise e aprove ou rejeite os estudos de caso submetidos pelos usuários.</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="warning" className="text-sm px-3 py-1">
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status === 'pending' ? 'Pendentes' : status === 'approved' ? 'Aprovados' : status === 'rejected' ? 'Rejeitados' : 'Todos'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Studies List */}
        <div className="space-y-4">
          {filteredCases.map((caseStudy) => (
            <Card
              key={caseStudy.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedCase?.id === caseStudy.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedCase(caseStudy)}
            >
              <div className="flex items-start justify-between mb-2">
                <Badge variant="info">{caseStudy.category}</Badge>
                <Badge variant={caseStudy.status === 'approved' ? 'success' : caseStudy.status === 'rejected' ? 'error' : 'warning'}>
                  {caseStudy.status === 'approved' ? 'Aprovado' : caseStudy.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                </Badge>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{caseStudy.title}</h3>
              <p className="text-sm text-slate-600 mb-3">{caseStudy.subtitle}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                  {caseStudy.authorAvatar}
                </div>
                <span>{caseStudy.author}</span>
                <span>•</span>
                <span>{new Date(caseStudy.submittedAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </Card>
          ))}
          {filteredCases.length === 0 && (
            <Card className="p-8 text-center text-slate-500">
              Nenhum estudo de caso encontrado
            </Card>
          )}
        </div>

        {/* Case Study Detail */}
        <div>
          {selectedCase ? (
            <Card className="p-6 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <Badge variant="info">{selectedCase.category}</Badge>
                <Badge variant={selectedCase.status === 'approved' ? 'success' : selectedCase.status === 'rejected' ? 'error' : 'warning'}>
                  {selectedCase.status === 'approved' ? 'Aprovado' : selectedCase.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedCase.title}</h2>
              <p className="text-slate-600 mb-4">{selectedCase.subtitle}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                  {selectedCase.authorAvatar}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{selectedCase.author}</p>
                  <p>Enviado em {new Date(selectedCase.submittedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-2">Conteúdo</h3>
                <div
                  className="prose prose-sm max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{ __html: selectedCase.content }}
                />
              </div>
              {selectedCase.status === 'pending' && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                  <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(selectedCase.id)}>
                    Rejeitar
                  </Button>
                  <Button className="flex-1" onClick={() => handleApprove(selectedCase.id)}>
                    Aprovar
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Selecione um estudo de caso para revisar</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
