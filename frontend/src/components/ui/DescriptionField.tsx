import { useState, useRef, useEffect, useCallback } from 'react'
import { uploadsApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import ImageFullscreenModal from './ImageFullscreenModal'

interface DescriptionFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  rows?: number
  required?: boolean
  className?: string
  helperText?: string
}

/**
 * Converte Markdown legado ou texto puro para HTML com imagens visuais.
 */
function convertToVisualHtml(raw: string): string {
  if (!raw) return ''

  // Se já for HTML com tags, mantém
  let html = raw

  // Converte Markdown ![alt](url) para figuras visuais interativas
  const mdImgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g
  html = html.replace(mdImgRegex, (_, alt, url) => {
    return `<figure class="nextstep-img-block my-2.5 p-1 bg-slate-50 border border-slate-200 rounded-lg inline-block max-w-full text-center relative select-none" contenteditable="false" data-url="${url}"><img src="${url}" alt="${alt || 'Imagem'}" class="max-h-64 max-w-full rounded-md object-contain mx-auto shadow-xs cursor-pointer hover:opacity-95" /><div class="mt-1 flex items-center justify-center gap-2"><button type="button" class="remove-img-btn text-[11px] text-red-600 hover:text-red-800 font-medium px-2 py-0.5 rounded hover:bg-red-50 transition-colors">Remover Imagem</button></div></figure><p><br></p>`
  })

  // Se não tiver tags HTML estruturais, quebra linhas em parágrafos
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    const lines = html.split('\n')
    html = lines
      .map((line) => (line.trim() ? `<p>${line}</p>` : '<p><br></p>'))
      .join('')
  }

  return html
}

/**
 * Limpa o HTML para salvar no banco (mantendo tags <img>, <p>, <b>, <i>, <ul>, etc.)
 */
function cleanHtmlForSaving(rawHtml: string): string {
  if (!rawHtml) return ''

  // Cria um elemento temporário para limpar botões auxiliares do editor
  const temp = document.createElement('div')
  temp.innerHTML = rawHtml

  // Remove botões de "Remover Imagem" que pertencem apenas à interface do editor
  const removeButtons = temp.querySelectorAll('.remove-img-btn')
  removeButtons.forEach((btn) => btn.parentElement?.remove())

  // Transforma cada <figure class="nextstep-img-block"> em uma imagem limpa se necessário
  const figures = temp.querySelectorAll('figure.nextstep-img-block')
  figures.forEach((fig) => {
    const img = fig.querySelector('img')
    if (img) {
      fig.replaceWith(img)
    }
  })

  return temp.innerHTML.trim()
}

export default function DescriptionField({
  value,
  onChange,
  label,
  placeholder = 'Escreva a descrição... Você pode colar imagens (Ctrl+V), arrastar arquivos ou clicar em Inserir Imagem.',
  rows = 4,
  required = false,
  className = '',
  helperText,
}: DescriptionFieldProps) {
  const { token } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInternalChange = useRef(false)

  // Sincroniza o valor externo apenas quando não for alteração interna
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const visualHtml = convertToVisualHtml(value || '')
      if (editorRef.current.innerHTML !== visualHtml) {
        editorRef.current.innerHTML = visualHtml
      }
    }
    isInternalChange.current = false
  }, [value])

  const notifyChange = useCallback(() => {
    if (!editorRef.current) return
    isInternalChange.current = true
    const currentHtml = editorRef.current.innerHTML
    const cleaned = cleanHtmlForSaving(currentHtml)
    onChange(cleaned)
  }, [onChange])

  // Insere um elemento HTML no local atual do cursor ou ao final
  const insertHtmlAtCursor = (html: string) => {
    const editor = editorRef.current
    if (!editor) return

    editor.focus()
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents()
        const fragment = range.createContextualFragment(html)
        const lastNode = fragment.lastChild
        range.insertNode(fragment)
        if (lastNode) {
          range.setStartAfter(lastNode)
          range.collapse(true)
          selection.removeAllRanges()
          selection.addRange(range)
        }
        notifyChange()
        return
      }
    }

    // Fallback: anexa ao final se não houver seleção válida
    editor.innerHTML += html
    notifyChange()
  }

  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Apenas arquivos de imagem são permitidos.')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadsApi.uploadImage(file, token || undefined)
      const altText = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'Imagem'
      
      // Insere o card visual da imagem (sem caminho nem markdown visível para o usuário)
      const imageBlock = `<figure class="nextstep-img-block my-2.5 p-1 bg-slate-50 border border-slate-200 rounded-lg inline-block max-w-full text-center relative select-none" contenteditable="false" data-url="${result.url}"><img src="${result.url}" alt="${altText}" class="max-h-64 max-w-full rounded-md object-contain mx-auto shadow-xs cursor-pointer hover:opacity-95" /><div class="mt-1 flex items-center justify-center gap-2"><button type="button" class="remove-img-btn text-[11px] text-red-600 hover:text-red-800 font-medium px-2 py-0.5 rounded hover:bg-red-50 transition-colors">Remover Imagem</button></div></figure><p><br></p>`
      insertHtmlAtCursor(imageBlock)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Falha ao enviar imagem')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Permite colar imagens diretamente com Ctrl + V
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          handleUploadFile(file)
          return
        }
      }
    }
  }

  // Suporte a arrastar e soltar imagem
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleUploadFile(files[0])
    }
  }

  // Cliques dentro do editor (remover imagem ou zoom)
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement

    // Se clicou no botão "Remover Imagem"
    if (target.classList.contains('remove-img-btn')) {
      e.preventDefault()
      e.stopPropagation()
      const figure = target.closest('figure.nextstep-img-block')
      if (figure) {
        figure.remove()
        notifyChange()
      }
      return
    }

    // Se clicou na imagem para visualizar em tela cheia
    if (target.tagName === 'IMG') {
      const src = (target as HTMLImageElement).src
      if (src) {
        setFullscreenImage(src)
      }
    }
  }

  // Executa comandos de formatação básica
  const executeCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg)
    editorRef.current?.focus()
    notifyChange()
  }

  // Altura aproximada baseada nas linhas informadas
  const minHeightStyle = { minHeight: `${Math.max(rows * 28, 100)}px` }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Caixa do Editor com Toolbar */}
      <div
        className={`border rounded-lg bg-white overflow-hidden transition-all shadow-xs ${
          isDragging
            ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20'
            : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
        }`}
      >
        {/* Barra de Ferramentas Superior */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            {/* Input oculto de arquivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUploadFile(file)
              }}
            />

            {/* Botão de Inserir Imagem */}
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-all shadow-2xs disabled:opacity-50"
              title="Inserir imagem do seu dispositivo"
            >
              {isUploading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Carregando imagem...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Inserir Imagem</span>
                </>
              )}
            </button>

            <span className="text-slate-300">|</span>

            {/* Formatações Rápidas */}
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              className="px-2 py-0.5 rounded font-bold hover:bg-slate-200 text-slate-700 transition-colors"
              title="Negrito"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              className="px-2 py-0.5 rounded italic font-serif hover:bg-slate-200 text-slate-700 transition-colors"
              title="Itálico"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              className="px-2 py-0.5 rounded hover:bg-slate-200 text-slate-700 transition-colors"
              title="Lista com marcadores"
            >
              • Lista
            </button>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Dica: Cole um print com Ctrl+V ou arraste uma foto
          </span>
        </div>

        {/* Área Visual Editável */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={notifyChange}
          onBlur={notifyChange}
          onPaste={handlePaste}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={handleEditorClick}
          style={minHeightStyle}
          data-placeholder={placeholder}
          className="p-3.5 text-sm text-slate-800 leading-relaxed outline-none focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none [&_p]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5"
        />
      </div>

      {/* Erro no upload */}
      {uploadError && (
        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {uploadError}
        </p>
      )}

      {helperText && !uploadError && (
        <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
      )}

      {/* Modal de tela cheia se o usuário clicar na imagem no editor */}
      <ImageFullscreenModal
        url={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </div>
  )
}
