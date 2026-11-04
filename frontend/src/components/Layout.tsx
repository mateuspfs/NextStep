import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../contexts/AuthContext'
import { usersApi } from '../services/api'
import Button from './ui/Button'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, token, updateCurrentUser } = useAuth()
  const navigate = useNavigate()

  const [showChangePwdModal, setShowChangePwdModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [isSavingPwd, setIsSavingPwd] = useState(false)

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdError('')

    if (newPassword.length < 8) {
      setPwdError('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPwdError('A confirmação de senha não confere.')
      return
    }

    if (!user?.id) return
    setIsSavingPwd(true)

    try {
      await usersApi.update(
        user.id,
        {
          fullName: user.fullName,
          email: user.email,
          password: newPassword,
        },
        token || undefined
      )
      updateCurrentUser({ mustChangePassword: false })
      setShowChangePwdModal(false)
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwdError(
        err instanceof Error
          ? err.message
          : 'Não foi possível redefinir a senha. Certifique-se de usar uma senha diferente da gerada pelo Admin.'
      )
    } finally {
      setIsSavingPwd(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onOpenPasswordReset={() => setShowChangePwdModal(true)} />
        {user?.mustChangePassword && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-900 text-sm">
              <span className="text-lg">⚠️</span>
              <span>
                <strong>Pendência de Segurança:</strong> Você está utilizando uma senha temporária gerada pela Administração. Redefina sua senha agora por uma senha pessoal exclusiva.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" onClick={() => setShowChangePwdModal(true)}>
                Redefinir Senha Agora
              </Button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="text-xs font-medium text-amber-800 hover:underline px-2 py-1"
              >
                Ir para Perfil
              </button>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Modal de Troca de Senha Temporária */}
      {showChangePwdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                  Segurança da Conta
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Redefinir Senha Temporária</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha uma nova senha que não seja a senha inicial gerada pelo Administrador.
                </p>
              </div>
              <button
                onClick={() => setShowChangePwdModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              {pwdError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
                  {pwdError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nova Senha Pessoal (mín. 8 caracteres) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setShowChangePwdModal(false)}>
                  Depois
                </Button>
                <Button type="submit" disabled={isSavingPwd}>
                  {isSavingPwd ? 'Salvando...' : 'Atualizar Senha'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
