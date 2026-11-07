import { useState, useRef } from 'react'
import { uploadsApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

interface ImageUploadButtonProps {
  onImageUploaded: (url: string) => void
  label?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  className?: string
  disabled?: boolean
}

export default function ImageUploadButton({
  onImageUploaded,
  label = 'Upload Imagem (S3)',
  className = '',
  disabled = false,
}: ImageUploadButtonProps) {
  const { token } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const result = await uploadsApi.uploadImage(file, token || undefined)
      onImageUploaded(result.url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro ao enviar imagem')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => fileInputRef.current?.click()}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{label}</span>
          </>
        )}
      </button>

      {uploadError && (
        <span className="text-[11px] text-red-600">{uploadError}</span>
      )}
    </div>
  )
}
