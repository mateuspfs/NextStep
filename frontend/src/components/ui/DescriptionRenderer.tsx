import { useState } from 'react'

interface DescriptionRendererProps {
  content?: string
  className?: string
  clampLines?: number
}

export default function DescriptionRenderer({
  content = '',
  className = '',
  clampLines,
}: DescriptionRendererProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  if (!content) {
    return null
  }

  // Se o conteúdo já for HTML com tags como <p>, <div>, etc.
  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  if (isHtml) {
    return (
      <>
        <div
          className={`prose prose-sm max-w-none text-slate-700 leading-relaxed [&_img]:rounded-lg [&_img]:shadow-sm [&_img]:max-h-96 [&_img]:object-contain [&_img]:cursor-pointer [&_img]:my-3 hover:[&_img]:opacity-95 ${
            clampLines ? `line-clamp-${clampLines}` : ''
          } ${className}`}
          dangerouslySetInnerHTML={{ __html: content }}
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'IMG') {
              const src = (target as HTMLImageElement).src
              if (src) setZoomedImage(src)
            }
          }}
        />

        {zoomedImage && (
          <ImageModal url={zoomedImage} onClose={() => setZoomedImage(null)} />
        )}
      </>
    )
  }

  // Processamento de texto com Markdown (suporte a ![alt](url), [link](url), **bold**, e quebras de linha)
  const renderFormattedText = (rawText: string) => {
    // Regex para detectar imagens markdown: ![alt](url)
    const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g
    const parts: (string | { type: 'image'; alt: string; url: string })[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = imageRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(rawText.substring(lastIndex, match.index))
      }
      parts.push({
        type: 'image',
        alt: match[1] || 'Imagem descritiva',
        url: match[2],
      })
      lastIndex = imageRegex.lastIndex
    }

    if (lastIndex < rawText.length) {
      parts.push(rawText.substring(lastIndex))
    }

    return parts.map((part, index) => {
      if (typeof part === 'object' && part.type === 'image') {
        return (
          <figure key={`img-${index}`} className="my-3 block">
            <img
              src={part.url}
              alt={part.alt}
              loading="lazy"
              onClick={() => setZoomedImage(part.url)}
              className="max-h-96 max-w-full rounded-lg border border-slate-200 shadow-sm object-contain cursor-zoom-in hover:opacity-95 transition-all bg-slate-50"
            />
            {part.alt && part.alt !== 'Imagem' && (
              <figcaption className="text-xs text-slate-500 mt-1 italic">
                {part.alt}
              </figcaption>
            )}
          </figure>
        )
      }

      // Parágrafos de texto puro
      return (
        <span key={`txt-${index}`} className="whitespace-pre-line">
          {part}
        </span>
      )
    })
  }

  return (
    <>
      <div
        className={`text-slate-700 leading-relaxed text-sm ${
          clampLines ? `line-clamp-${clampLines}` : ''
        } ${className}`}
      >
        {renderFormattedText(content)}
      </div>

      {zoomedImage && (
        <ImageModal url={zoomedImage} onClose={() => setZoomedImage(null)} />
      )}
    </>
  )
}

function ImageModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white flex items-center gap-1 text-sm bg-black/40 px-3 py-1 rounded-full transition-colors"
        >
          <span>Fechar</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={url}
          alt="Visualização ampliada"
          className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 text-xs text-blue-300 hover:text-blue-100 underline"
        >
          Abrir imagem original em nova aba
        </a>
      </div>
    </div>
  )
}
