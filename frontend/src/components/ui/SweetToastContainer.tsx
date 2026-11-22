import { useState, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, Zap, X } from 'lucide-react'
import { subscribeToToasts, SweetToastMessage } from '../../utils/toast'

export default function SweetToastContainer() {
  const [toasts, setToasts] = useState<SweetToastMessage[]>([])

  useEffect(() => {
    return subscribeToToasts((newToast) => {
      setToasts((prev) => [newToast, ...prev].slice(0, 4))
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      }, newToast.duration || 3800)
    })
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-4 z-[220] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isXp = toast.type === 'xp'
        const isSuccess = toast.type === 'success'
        const isWarning = toast.type === 'warning'
        const isError = toast.type === 'error'

        const borderColor = isXp
          ? 'border-amber-400 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white'
          : isSuccess
          ? 'border-emerald-200 bg-white text-slate-900'
          : isWarning
          ? 'border-amber-300 bg-white text-slate-900'
          : isError
          ? 'border-red-300 bg-white text-slate-900'
          : 'border-blue-200 bg-white text-slate-900'

        const progressColor = isXp
          ? 'bg-amber-400'
          : isSuccess
          ? 'bg-emerald-500'
          : isWarning
          ? 'bg-amber-500'
          : isError
          ? 'bg-red-500'
          : 'bg-blue-500'

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-xl border ${borderColor} shadow-2xl px-4 py-3.5 flex items-center gap-3.5 transition-all duration-300 animate-in fade-in slide-in-from-left-5`}
          >
            {/* SweetAlert-style Icon Circle */}
            {isXp ? (
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-extrabold text-xs shrink-0 shadow-inner gap-0.5">
                <Zap className="w-3.5 h-3.5 fill-amber-300" />
                <span>+{toast.xpAmount}</span>
              </div>
            ) : isSuccess ? (
              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : isWarning ? (
              <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : isError ? (
              <div className="w-9 h-9 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Info className="w-5 h-5" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold leading-snug ${isXp ? 'text-amber-300' : 'text-slate-900'}`}>
                {toast.title}
              </p>
              {toast.subtitle && (
                <p className={`text-xs mt-0.5 leading-snug ${isXp ? 'text-blue-100' : 'text-slate-500'}`}>
                  {toast.subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className={`p-1 rounded hover:bg-black/10 ${
                isXp ? 'text-slate-300 hover:text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* SweetAlert timer progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
              <div className={`h-full ${progressColor} animate-pulse w-full`} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
