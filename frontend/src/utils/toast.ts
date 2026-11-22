// Global event-based SweetAlert-style Toast notification system (top-left corner)

export type SweetToastType = 'success' | 'error' | 'warning' | 'info' | 'xp'

export interface SweetToastMessage {
  id: string
  type: SweetToastType
  title: string
  subtitle?: string
  xpAmount?: number
  duration?: number
}

type ToastListener = (toast: SweetToastMessage) => void

const listeners = new Set<ToastListener>()

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function showToast(
  title: string,
  options?: {
    type?: SweetToastType
    subtitle?: string
    xpAmount?: number
    duration?: number
  }
) {
  const toast: SweetToastMessage = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: options?.type || 'success',
    title,
    subtitle: options?.subtitle,
    xpAmount: options?.xpAmount,
    duration: options?.duration || 3800,
  }
  listeners.forEach((fn) => fn(toast))
}

export function showXpToast(xpAmount: number, reason?: string) {
  if (xpAmount <= 0) return
  showToast(`+${xpAmount} NexPoints!`, {
    type: 'xp',
    subtitle: reason || 'Pontuação adicionada ao seu saldo',
    xpAmount,
    duration: 4000,
  })
}
