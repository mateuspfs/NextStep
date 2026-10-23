import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usersApi, caseStudiesApi, coursesApi, categoriesApi } from '../services/api'
import { useApi } from '../hooks/useApi'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

export default function AdminPanel() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const { data: users } = useApi(() => usersApi.getAll(token || undefined), [token])
  const { data: pendingCases } = useApi(() => caseStudiesApi.getPending(token || undefined), [token])
  const { data: courses } = useApi(() => coursesApi.getAll(token || undefined), [token])
  const { data: categories } = useApi(() => categoriesApi.getAll(token || undefined), [token])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Governança e Controle</p>
        <h1 className="text-3xl font-bold text-slate-900">Visão Geral Administrativa</h1>
        <p className="text-slate-600 mt-1">
          Acompanhe indicadores da plataforma, gerencie colaboradores, aprove conteúdos e publique treinamentos.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 cursor-pointer hover:border-blue-300 transition-all" onClick={() => navigate('/admin/users')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Colaboradores</span>
            <Badge variant="info">Ativos</Badge>
          </div>
          <p className="text-3xl font-bold text-slate-900">{users?.length ?? 5}</p>
          <p className="text-xs text-blue-600 mt-1">Gerenciar acessos e perfis →</p>
        </Card>

        <Card className="p-5 cursor-pointer hover:border-blue-300 transition-all" onClick={() => navigate('/admin/approvals')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Fila de Aprovação</span>
            <Badge variant={(pendingCases?.length ?? 0) > 0 ? 'warning' : 'success'}>
              {(pendingCases?.length ?? 0) > 0 ? 'Ação Necessária' : 'Em Dia'}
            </Badge>
          </div>
          <p className="text-3xl font-bold text-slate-900">{pendingCases?.length ?? 0}</p>
          <p className="text-xs text-amber-600 mt-1">Estudos de caso pendentes →</p>
        </Card>

        <Card className="p-5 cursor-pointer hover:border-blue-300 transition-all" onClick={() => navigate('/admin/courses')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Treinamentos</span>
            <Badge variant="success">Catálogo</Badge>
          </div>
          <p className="text-3xl font-bold text-slate-900">{courses?.length ?? 5}</p>
          <p className="text-xs text-green-600 mt-1">Publicar ou editar cursos →</p>
        </Card>

        <Card className="p-5 cursor-pointer hover:border-blue-300 transition-all" onClick={() => navigate('/admin/categories')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Categorias</span>
            <Badge variant="default">Taxonomia</Badge>
          </div>
          <p className="text-3xl font-bold text-slate-900">{categories?.length ?? 5}</p>
          <p className="text-xs text-slate-600 mt-1">Organizar áreas e tags →</p>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Ações Rápidas de Gestão</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/users')}>
              👥 Cadastrar Usuário
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/courses')}>
              🎓 Novo Treinamento
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/approvals')}>
              ✅ Revisar Estudos de Caso
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/categories')}>
              🏷️ Gerenciar Categorias
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Status do Ecossistema NextStep</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-900 font-medium">Banco de Dados RDS MySQL</span>
              <Badge variant="success">Conectado</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-blue-900 font-medium">Central de Processos & Fórum</span>
              <Badge variant="info">Sincronizado</Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-700 font-medium">Gamificação (XP, Ranks & Badges)</span>
              <Badge variant="success">Ativo</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
