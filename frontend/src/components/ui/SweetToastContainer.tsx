import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertTriangle, XCircle, Info, Zap, X, Trash2 } from 'lucide-react'
import {
  subscribeToToasts,
  subscribeToConfirms,
  SweetToastMessage,
  SweetConfirmRequest,
} from '../../utils/toast'

export default function SweetToastContainer() {
  const [toasts, setToasts] = useState<SweetToastMessage[]>([])
  const [confirmQueue, setConfirmQueue] = useState<SweetConfirmRequest[]>([])

  useEffect(() => {
    const unsubToasts = subscribeToToasts((newToast) => {
      setToasts((prev) => [newToast, ...prev].slice(0, 4))
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      }, newToast.duration || 3800)
    })

    const unsubConfirms = subscribeToConfirms((req) => {
      setConfirmQueue((prev) => [...prev, req])
    })

    return () => {
      unsubToasts()
      unsubConfirms()
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const activeConfirm = confirmQueue[0] || null

  const handleConfirmDecision = (result: boolean) => {
    if (!activeConfirm) return
    activeConfirm.resolve(result)
    setConfirmQueue((prev) => prev.slice(1))
  }

  const toastPortal =
    toasts.length > 0
      ? createPortal(
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

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
                    <div className={`h-full ${progressColor} animate-pulse w-full`} />
                  </div>
                </div>
              )
            })}
          </div>,
          document.body
        )
      : null

  const confirmPortal = activeConfirm
    ? createPortal(
        <div
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => handleConfirmDecision(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center">
              {activeConfirm.variant === 'danger' ? (
                <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center text-red-600">
                  <Trash2 className="w-8 h-8" />
                </div>
              ) : activeConfirm.variant === 'info' ? (
                <div className="w-16 h-16 rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center text-blue-600">
                  <Info className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-slate-900">{activeConfirm.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{activeConfirm.message}</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmDecision(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {activeConfirm.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDecision(true)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors ${
                  activeConfirm.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : activeConfirm.variant === 'info'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {activeConfirm.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      {toastPortal}
      {confirmPortal}
    </>
  )
}
