import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'

export default function AdminPanel() {
  const navigate = useNavigate()
  const location = useLocation()

  // Redirect to users page by default
  useEffect(() => {
    if (location.pathname === '/admin') {
      navigate('/admin/users', { replace: true })
    }
  }, [location.pathname, navigate])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 uppercase tracking-wide mb-1">Administração</p>
        <h1 className="text-3xl font-bold text-slate-900">Painel Administrativo</h1>
        <p className="text-slate-600 mt-1">Selecione uma opção no menu lateral para gerenciar.</p>
      </div>
      <Card className="p-8 text-center text-slate-500">
        <p>Selecione uma opção no menu lateral.</p>
      </Card>
    </div>
  )
}
