import { useEffect } from 'react'

interface ImageFullscreenModalProps {
  url: string | null
  onClose: () => void
}

export default function ImageFullscreenModal({ url, onClose }: ImageFullscreenModalProps) {
  useEffect(() => {
    if (!url) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [url, onClose])

  if (!url) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="relative max-w-6xl max-h-[92vh] flex flex-col items-center">
        <button
          onClick={onClose}
          type="button"
          className="absolute -top-11 right-0 text-white/90 hover:text-white flex items-center gap-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors backdrop-blur-md"
        >
          <span>Fechar (Esc)</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <img
          src={url}
          alt="Imagem em tela cheia"
          className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain bg-slate-900 border border-white/10 select-none"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="mt-3 flex items-center gap-4 text-xs text-white/70">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-300 hover:text-blue-100 underline flex items-center gap-1"
          >
            <span>Abrir imagem em alta resolução</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
