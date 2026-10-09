import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'

const pendingRequests = [
  {
    id: 1,
    type: 'Processo',
    title: 'Novo Processo de Onboarding',
    description: 'Solicitação de criação de processo para integração de novos colaboradores.',
    user: 'Carlos Mendes',
    userAvatar: 'CM',
    date: '2h atrás',
    status: 'pending',
  },
  {
    id: 2,
    type: 'Estudo de Caso',
    title: 'Análise de Incidente de Segurança',
    description: 'Documentação detalhada sobre o incidente de segurança ocorrido no último trimestre.',
    user: 'Ana Silva',
    userAvatar: 'AS',
    date: '5h atrás',
    status: 'pending',
  },
  {
    id: 3,
    type: 'Artigo',
    title: 'Boas Práticas de Code Review',
    description: 'Artigo técnico sobre práticas recomendadas para revisão de código.',
    user: 'Pedro Lima',
    userAvatar: 'PL',
    date: '1 dia atrás',
    status: 'pending',
  },
]

const users = [
  { id: 1, name: 'Ana Silva', email: 'ana.silva@nextstep.com', role: 'Admin', activities: 45, articles: 12, cases: 8, processes: 15 },
  { id: 2, name: 'Carlos Mendes', email: 'carlos.mendes@nextstep.com', role: 'Common', activities: 32, articles: 8, cases: 5, processes: 10 },
  { id: 3, name: 'Maria Santos', email: 'maria.santos@nextstep.com', role: 'Common', activities: 28, articles: 6, cases: 3, processes: 7 },
  { id: 4, name: 'Pedro Lima', email: 'pedro.lima@nextstep.com', role: 'Common', activities: 22, articles: 4, cases: 2, processes: 5 },
]

export default function AdminPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Administração</p>
        <h1 className="text-3xl font-bold text-slate-900">Painel Administrativo</h1>
        <p className="text-slate-600 mt-1">Gerencie usuários, solicitações e conteúdos da plataforma.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Usuários Ativos', value: '156', icon: 'users' },
          { label: 'Conteúdos Publicados', value: '342', icon: 'document' },
          { label: 'Solicitações Pendentes', value: '12', icon: 'clock' },
          { label: 'Atividades Criadas', value: '89', icon: 'activity' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Solicitações Pendentes</h3>
            <Badge variant="warning">{pendingRequests.length} novas</Badge>
          </div>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="info">{request.type}</Badge>
                  <span className="text-xs text-slate-500">{request.date}</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">{request.title}</h4>
                <p className="text-sm text-slate-600 mb-3">{request.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={request.user} size="sm" />
                    <span className="text-sm text-slate-600">{request.user}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Rejeitar</Button>
                    <Button size="sm">Aprovar</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Users Management */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Gestão de Usuários</h3>
            <Button size="sm">+ Novo Usuário</Button>
          </div>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <Avatar name={user.name} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <Badge variant={user.role === 'Admin' ? 'info' : 'default'}>{user.role}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-900 font-medium">{user.activities} atividades</p>
                  <p className="text-slate-500">{user.articles} artigos • {user.cases} casos</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
