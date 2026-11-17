import { useState } from 'react'
import { extractTopicMedia } from '../../utils/mediaUtils'
import ImageFullscreenModal from './ImageFullscreenModal'

interface TopicMediaPreviewProps {
  content: string
  clampLines?: number
  className?: string
  thumbnailClassName?: string
}

export default function TopicMediaPreview({
  content,
  clampLines = 2,
  className = '',
  thumbnailClassName = '',
}: TopicMediaPreviewProps) {
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null)
  const media = extractTopicMedia(content)

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {/* Caso a primeira coisa seja imagem, ou caso possua imagem no tópico */}
        {media.firstImageUrl && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              setFullscreenUrl(media.firstImageUrl)
            }}
            className={`group relative cursor-zoom-in rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-xs hover:shadow-md transition-all ${
              media.startsWithImage
                ? 'w-full max-w-md h-36 mb-2 block'
                : 'w-28 h-20 sm:w-36 sm:h-24 float-right ml-3 mb-1 block'
            } ${thumbnailClassName}`}
            title="Clique para visualizar a imagem em tela cheia"
          >
            <img
              src={media.firstImageUrl}
              alt="Imagem do tópico"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
              <span className="opacity-0 group-hover:opacity-100 bg-black/75 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-xs font-medium flex items-center gap-1.5 shadow-sm transition-opacity">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Tela Cheia
              </span>
            </div>
          </div>
        )}

        {/* Texto limpo e legível do tópico */}
        <p className={`text-sm text-slate-600 leading-relaxed ${clampLines ? `line-clamp-${clampLines}` : ''}`}>
          {media.cleanText || (media.firstImageUrl ? 'Tópico com imagem ilustrativa.' : '')}
        </p>
      </div>

      <ImageFullscreenModal
        url={fullscreenUrl}
        onClose={() => setFullscreenUrl(null)}
      />
    </>
  )
}
