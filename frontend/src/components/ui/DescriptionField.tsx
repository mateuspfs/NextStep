import { useState, useRef } from 'react'
import { uploadsApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import DescriptionRenderer from './DescriptionRenderer'

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

export default function DescriptionField({
  value,
  onChange,
  label,
  placeholder = 'Escreva a descrição... Você pode colar imagens (Ctrl+V), arrastar arquivos ou clicar em Adicionar Imagem.',
  rows = 4,
  required = false,
  className = '',
  helperText,
}: DescriptionFieldProps) {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      onChange((value ? value + '\n\n' : '') + textToInsert)
      return
    }

    const startPos = textarea.selectionStart
    const endPos = textarea.selectionEnd
    const currentVal = value || ''

    const newVal =
      currentVal.substring(0, startPos) +
      textToInsert +
      currentVal.substring(endPos)

    onChange(newVal)

    // Reposiciona o cursor após o texto inserido
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        startPos + textToInsert.length,
        startPos + textToInsert.length
      )
    }, 50)
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
      const markdownImage = `\n\n![${altText}](${result.url})\n\n`
      insertTextAtCursor(markdownImage)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Falha ao enviar imagem para o S3')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Suporte a colar imagem da área de transferência (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          handleUploadFile(file)
          break
        }
      }
    }
  }

  // Suporte a arrastar e soltar (drag & drop)
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleUploadFile(files[0])
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Cabeçalho do campo com Label e Abas */}
      <div className="flex items-center justify-between">
        {label ? (
          <label className="block text-sm font-medium text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'edit'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Visualizar {value.includes('![') && '🖼️'}
          </button>
        </div>
      </div>

      {/* Barra de Ações Rápidas de Mídia */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 border-b-0 rounded-t-lg px-3 py-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-2">
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
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-all shadow-xs disabled:opacity-50"
            title="Upload de imagem para o Amazon S3"
          >
            {isUploading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Enviando para S3...</span>
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
                <span>Inserir Imagem (S3)</span>
              </>
            )}
          </button>
          <span className="text-slate-400">|</span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Dica: Cole um print com Ctrl+V ou arraste uma foto
          </span>
        </div>

        {isUploading && (
          <span className="text-[11px] text-blue-600 font-medium animate-pulse">
            Gravando no S3...
          </span>
        )}
      </div>

      {/* Área Principal (Edição ou Pré-visualização) */}
      <div className="relative">
        {activeTab === 'edit' ? (
          <textarea
            ref={textareaRef}
            rows={rows}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            placeholder={placeholder}
            className={`w-full px-3 py-2.5 border border-slate-200 rounded-b-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-sans leading-relaxed ${
              isDragging ? 'border-blue-500 bg-blue-50/30' : ''
            }`}
          />
        ) : (
          <div className="w-full min-h-[120px] p-3.5 border border-slate-200 rounded-b-lg bg-white overflow-y-auto max-h-96">
            {value.trim() ? (
              <DescriptionRenderer content={value} />
            ) : (
              <p className="text-xs text-slate-400 italic">
                Nenhum conteúdo para pré-visualizar ainda.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mensagem de Erro do Upload */}
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
    </div>
  )
}
