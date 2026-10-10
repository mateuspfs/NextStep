import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    CKEDITOR: any
  }
}

interface CKEditorProps {
  value: string
  onChange: (data: string) => void
  placeholder?: string
}

export default function CKEditor({ value, onChange, placeholder = 'Digite aqui...' }: CKEditorProps) {
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isReady = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Wait for CKEditor to be loaded via CDN
    const initEditor = () => {
      if (typeof window.CKEDITOR === 'undefined') {
        setTimeout(initEditor, 100)
        return
      }

      if (editorRef.current) return

      window.CKEDITOR.ClassicEditor.create(containerRef.current, {
        toolbar: [
          'heading', '|',
          'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
          'indent', 'outdent', '|',
          'imageUpload', 'blockQuote', 'insertTable', 'mediaEmbed', '|',
          'undo', 'redo', '|',
          'sourceEditing'
        ],
        placeholder: placeholder,
        language: 'pt-br',
      }).then((editor: any) => {
        editorRef.current = editor
        isReady.current = true

        // Set initial value if exists
        if (value) {
          editor.setData(value)
        }

        // Listen for changes
        editor.model.document.on('change:data', () => {
          const data = editor.getData()
          onChange(data)
        })
      }).catch((error: any) => {
        console.error('CKEditor initialization error:', error)
      })
    }

    initEditor()

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [])

  // Update editor data when value changes externally
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
