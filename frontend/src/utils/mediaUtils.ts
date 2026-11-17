export interface TopicMediaInfo {
  firstImageUrl: string | null
  cleanText: string
  hasImage: boolean
  startsWithImage: boolean
}

/**
 * Analisa o conteúdo (HTML ou Markdown) para extrair a primeira imagem
 * e o texto limpo para pré-visualização em listagens de tópicos.
 */
export function extractTopicMedia(content: string = ''): TopicMediaInfo {
  if (!content) {
    return { firstImageUrl: null, cleanText: '', hasImage: false, startsWithImage: false }
  }

  const raw = content.trim()

  // Procura por tag HTML <img>
  const htmlImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i
  // Procura por imagem Markdown ![alt](url)
  const mdImgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/i

  const htmlMatch = htmlImgRegex.exec(raw)
  const mdMatch = mdImgRegex.exec(raw)

  let firstImageUrl: string | null = null
  let startsWithImage = false

  if (htmlMatch && (!mdMatch || htmlMatch.index <= mdMatch.index)) {
    firstImageUrl = htmlMatch[1]
    const textBefore = raw.substring(0, htmlMatch.index).replace(/<[^>]*>/g, '').trim()
    startsWithImage = textBefore.length === 0
  } else if (mdMatch) {
    firstImageUrl = mdMatch[2]
    const textBefore = raw.substring(0, mdMatch.index).trim()
    startsWithImage = textBefore.length === 0
  }

  // Limpa o texto para visualização em cards de listagem (remove HTML e markdown de imagens)
  const cleanText = raw
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    firstImageUrl,
    cleanText,
    hasImage: Boolean(firstImageUrl),
    startsWithImage,
  }
}
