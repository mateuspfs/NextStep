import { useEffect, useRef } from 'react'
import { uploadsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

declare global {
  interface Window {
    ClassicEditor: any
  }
}

interface CKEditorProps {
  value: string
  onChange: (data: string) => void
  placeholder?: string
}

class S3UploadAdapter {
  private loader: any
  private token?: string

  constructor(loader: any, token?: string) {
    this.loader = loader
    this.token = token
  }

  async upload(): Promise<{ default: string }> {
    const file = await this.loader.file
    const result = await uploadsApi.uploadImage(file, this.token)
    return {
      default: result.url,
    }
  }

  abort(): void {
    // Abort logic if needed
  }
}

export default function CKEditor({ value, onChange, placeholder = 'Digite aqui...' }: CKEditorProps) {
  const { token } = useAuth()
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isReady = useRef(false)
  const isInitializing = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const valueRef = useRef(value)
  valueRef.current = value
  const tokenRef = useRef(token)
  tokenRef.current = token

  useEffect(() => {
    if (!containerRef.current) return

    const initEditor = () => {
      if (typeof window.ClassicEditor === 'undefined') {
        setTimeout(initEditor, 100)
        return
      }

      // Prevent duplicate initialization
      if (editorRef.current || isInitializing.current) return
      isInitializing.current = true

      window.ClassicEditor.create(containerRef.current!, {
        extraPlugins: [
          function (editor: any) {
            try {
              const fileRepo = editor.plugins.get('FileRepository')
              if (fileRepo) {
                fileRepo.createUploadAdapter = (loader: any) => {
                  return new S3UploadAdapter(loader, tokenRef.current || undefined)
                }
              }
            } catch (err) {
              console.warn('FileRepository plugin not available:', err)
            }
          },
        ],
        toolbar: [
          'heading', '|',
          'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
          'imageUpload', '|',
          'indent', 'outdent', '|',
          'blockQuote', 'insertTable', '|',
          'undo', 'redo'
        ],
        placeholder: placeholder,
        language: 'pt-br',
      }).then((editor: any) => {
        editorRef.current = editor
        isReady.current = true
        isInitializing.current = false

        if (valueRef.current) {
          editor.setData(valueRef.current)
        }

        editor.model.document.on('change:data', () => {
          const data = editor.getData()
          onChangeRef.current(data)
        })
      }).catch((error: any) => {
        isInitializing.current = false
        console.error('CKEditor initialization error:', error)
      })
    }

    initEditor()

    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.destroy()
        } catch (e) {
          // ignore
        }
        editorRef.current = null
        isReady.current = false
      }
    }
  }, [])

  useEffect(() => {
    if (isReady.current && editorRef.current && value !== editorRef.current.getData()) {
      editorRef.current.setData(value)
    }
  }, [value])

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div ref={containerRef} className="min-h-[200px]" />
    </div>
  )
}
