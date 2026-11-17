import { useState } from 'react'
import ImageFullscreenModal from './ImageFullscreenModal'

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

  // Se o conteúdo for HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  if (isHtml) {
    return (
      <>
        <div
          className={`prose prose-sm max-w-none text-slate-700 leading-relaxed [&_img]:rounded-lg [&_img]:shadow-xs [&_img]:max-h-96 [&_img]:object-contain [&_img]:cursor-zoom-in [&_img]:my-3 hover:[&_img]:opacity-95 ${
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

        <ImageFullscreenModal
          url={zoomedImage}
          onClose={() => setZoomedImage(null)}
        />
      </>
    )
  }

  // Fallback para Markdown legado
  const renderFormattedText = (rawText: string) => {
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
      if (typeof part === 'string') {
        return (
          <span key={`txt-${index}`} className="whitespace-pre-line">
            {part}
          </span>
        )
      }

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

      <ImageFullscreenModal
        url={zoomedImage}
        onClose={() => setZoomedImage(null)}
      />
    </>
  )
}
