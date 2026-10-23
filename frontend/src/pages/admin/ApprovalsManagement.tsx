import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { caseStudiesApi } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

interface CaseStudy {
  id: string
  title: string
  subtitle: string
  description: string
  categoryName: string
  authorName: string
  status: number
  createdAt: string
}

export default function ApprovalsManagement() {
  const { token } = useAuth()
  const { data: caseStudies, loading, refetch } = useApi<CaseStudy[]>(
    () => caseStudiesApi.getAdminAll(token || undefined),
    [token]
  )

  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending')
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredCases = caseStudies?.filter((cs) => {
    if (statusFilter === 'Pending') return cs.status === 0
    if (statusFilter === 'Approved') return cs.status === 1
    if (statusFilter === 'Rejected') return cs.status === 2
    return true
  })

  const getStatusBadge = (status: number) => {
    if (status === 0) return <Badge variant="warning">Pendente</Badge>
    if (status === 1) return <Badge variant="success">Aprovado</Badge>
    return <Badge variant="error">Rejeitado</Badge>
  }

  const handleApprove = async (id: string) => {
    setIsProcessing(true)
    try {
      await caseStudiesApi.approve(id, token || undefined)
      setSelectedCase(null)
      refetch()
    } catch (err) {
      console.error('Error approving:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (id: string) => {
    setIsProcessing(true)
    try {
      await caseStudiesApi.reject(id, token || undefined)
      setSelectedCase(null)
      refetch()
    } catch (err) {
      console.error('Error rejecting:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Carregando estudos de caso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Administração</p>
          <h1 className="text-3xl font-bold text-slate-900">Aprovações de Estudos de Caso</h1>
          <p className="text-slate-600 mt-1">
            Revise, aprove ou rejeite os estudos de caso submetidos para controlar o que fica visível na Base de Conhecimento.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start">
          {[
            { id: 'Pending', label: `Pendentes (${caseStudies?.filter(c => c.status === 0).length ?? 0})` },
            { id: 'Approved', label: `Aprovados (${caseStudies?.filter(c => c.status === 1).length ?? 0})` },
            { id: 'Rejected', label: `Rejeitados (${caseStudies?.filter(c => c.status === 2).length ?? 0})` },
            { id: 'All', label: 'Todos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as typeof statusFilter)
                setSelectedCase(null)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Studies List */}
        <div className="space-y-4">
          {filteredCases?.map((caseStudy) => (
            <Card
              key={caseStudy.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedCase?.id === caseStudy.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedCase(caseStudy)}
            >
              <div className="flex items-start justify-between mb-2">
                <Badge variant="info">{caseStudy.categoryName}</Badge>
                {getStatusBadge(caseStudy.status)}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{caseStudy.title}</h3>
              <p className="text-sm text-slate-600 mb-3">{caseStudy.subtitle}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                  {caseStudy.authorName?.charAt(0) || 'C'}
                </div>
                <span>{caseStudy.authorName}</span>
                <span>•</span>
                <span>{new Date(caseStudy.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </Card>
          ))}
          {filteredCases?.length === 0 && (
            <Card className="p-8 text-center text-slate-500">
              Nenhum estudo de caso encontrado neste filtro.
            </Card>
          )}
        </div>

        {/* Case Study Detail */}
        <div>
          {selectedCase ? (
            <Card className="p-6 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <Badge variant="info">{selectedCase.categoryName}</Badge>
                {getStatusBadge(selectedCase.status)}
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedCase.title}</h2>
              <p className="text-slate-600 mb-4">{selectedCase.subtitle}</p>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                  {selectedCase.authorName?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{selectedCase.authorName}</p>
                  <p>Enviado em {new Date(selectedCase.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-semibold text-slate-900 mb-2">Conteúdo</h3>
                <div
                  className="prose prose-sm max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{ __html: selectedCase.description }}
                />
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                {selectedCase.status !== 2 && (
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleReject(selectedCase.id)}
                    disabled={isProcessing}
                  >
                    {selectedCase.status === 1 ? 'Despublicar / Rejeitar' : 'Rejeitar'}
                  </Button>
                )}
                {selectedCase.status !== 1 && (
                  <Button
                    className="flex-1"
                    onClick={() => handleApprove(selectedCase.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processando...' : 'Aprovar e Publicar'}
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Selecione um estudo de caso para revisar ou alterar seu status</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
