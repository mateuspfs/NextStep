// Global event-based SweetAlert-style Toast & Confirmation Dialog system

export type SweetToastType = 'success' | 'error' | 'warning' | 'info' | 'xp'

export interface SweetToastMessage {
  id: string
  type: SweetToastType
  title: string
  subtitle?: string
  xpAmount?: number
  duration?: number
}

export interface SweetConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export interface SweetConfirmRequest extends SweetConfirmOptions {
  id: string
  resolve: (confirmed: boolean) => void
}

type ToastListener = (toast: SweetToastMessage) => void
type ConfirmListener = (req: SweetConfirmRequest) => void

const listeners = new Set<ToastListener>()
const confirmListeners = new Set<ConfirmListener>()

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function subscribeToConfirms(listener: ConfirmListener): () => void {
  confirmListeners.add(listener)
  return () => {
    confirmListeners.delete(listener)
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

export function showConfirm(options: SweetConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (confirmListeners.size === 0) {
      resolve(window.confirm(`${options.title}\n\n${options.message}`))
      return
    }
    const req: SweetConfirmRequest = {
      ...options,
      id: `confirm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      resolve,
    }
    confirmListeners.forEach((fn) => fn(req))
  })
}
