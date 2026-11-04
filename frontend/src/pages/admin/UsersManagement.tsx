import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usersApi } from '../../services/api'
import { useApi } from '../../hooks/useApi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'

interface User {
  id: string
  fullName: string
  email: string
  role: 'Common' | 'Admin'
  nexPoints: number
  photoUrl?: string
  createdAt: string
}

export default function UsersManagement() {
  const { token } = useAuth()
  const { data: users, loading, refetch } = useApi<User[]>(
    () => usersApi.getAll(token || undefined),
    [token]
  )

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(true)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Common' as 'Common' | 'Admin',
  })

  const generateTempPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghijkmnopqrstuvwxyz'
    const digits = '23456789'
    const symbols = '!@#$*'
    const pick = (str: string) => str[Math.floor(Math.random() * str.length)]
    const raw = [
      'Nx',
      pick(upper),
      pick(lower),
      pick(lower),
      pick(digits),
      pick(digits),
      pick(digits),
      pick(symbols),
      pick(upper),
    ].join('')
    setNewUser((prev) => ({ ...prev, password: raw }))
    setShowPassword(true)
    setCopiedPassword(false)
  }

  const handleCopyPassword = async () => {
    if (!newUser.password) return
    try {
      await navigator.clipboard.writeText(newUser.password)
      setCopiedPassword(true)
      setTimeout(() => setCopiedPassword(false), 2500)
    } catch {
      // ignore clipboard error
    }
  }
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'Common'>('All')

  const normalizeRole = (role: unknown): 'Common' | 'Admin' => {
    const val = String(role)
    return val === '1' || val === 'Admin' || val === 'admin' ? 'Admin' : 'Common'
  }

  const filteredUsers = users?.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const userRole = normalizeRole(u.role)
    const matchesRole = roleFilter === 'All' || userRole === roleFilter
    return matchesSearch && matchesRole
  })

  const handleOpenEdit = (u: User) => {
    setEditingUser(u)
    setNewUser({
      fullName: u.fullName,
      email: u.email,
      password: '',
      role: normalizeRole(u.role),
    })
    setError('')
    setShowCreateModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsCreating(true)

    try {
      if (editingUser) {
        await usersApi.update(
          editingUser.id,
          {
            fullName: newUser.fullName.trim(),
            email: newUser.email.trim(),
            password: newUser.password.trim() || undefined,
            role: newUser.role,
          },
          token || undefined
        )
      } else {
        await usersApi.create(newUser, token || undefined)
      }
      setShowCreateModal(false)
      setEditingUser(null)
      setNewUser({ fullName: '', email: '', password: '', role: 'Common' })
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar usuário')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    try {
      await usersApi.delete(id, token || undefined)
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir usuário')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Administração</p>
        <h1 className="text-3xl font-bold text-slate-900">Gestão de Usuários</h1>
        <p className="text-slate-600 mt-1">Gerencie os usuários da plataforma NextStep.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Filtrar:</span>
          {(['All', 'Admin', 'Common'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'All' ? 'Todos' : role === 'Admin' ? 'Admins' : 'Comuns'}
            </button>
          ))}
        </div>
        <Button onClick={() => { setEditingUser(null); setNewUser({ fullName: '', email: '', password: '', role: 'Common' }); setShowCreateModal(true) }}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Novo Usuário
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Usuário</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Nível</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">XP</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Cadastro</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user.fullName.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={normalizeRole(user.role) === 'Admin' ? 'info' : 'default'}>
                      {normalizeRole(user.role) === 'Admin' ? 'Admin' : 'Comum'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.nexPoints} XP</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        title="Editar Usuário"
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        title="Excluir Usuário"
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers?.length === 0 && (
          <div className="text-center py-8 text-slate-500">Nenhum usuário encontrado</div>
        )}
      </Card>

      {/* Create/Edit User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                <input type="text" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} required className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    {editingUser ? 'Nova Senha Temporária (opcional)' : 'Senha Inicial Temporária'}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={generateTempPassword}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                    >
                      🔑 Gerar Senha
                    </button>
                    {newUser.password && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                      >
                        {copiedPassword ? '✅ Copiada!' : '📋 Copiar'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required={!editingUser}
                    minLength={editingUser ? undefined : 8}
                    placeholder={editingUser ? 'Deixe em branco para manter a senha atual' : 'Clique em "Gerar Senha" ou digite (mín. 8 caracteres)'}
                    className="w-full px-4 py-2.5 pr-16 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {!editingUser && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    ⚠️ O colaborador receberá uma notificação e pendência obrigatória para trocar esta senha no primeiro login.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nível de acesso</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'Common' | 'Admin' })} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="Common">Usuário Comum</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                <Button type="submit" className="flex-1" disabled={isCreating}>
                  {isCreating ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
