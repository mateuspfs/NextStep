import { useEffect, useRef } from 'react'

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

export default function CKEditor({ value, onChange, placeholder = 'Digite aqui...' }: CKEditorProps) {
  const editorRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isReady = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const initEditor = () => {
      if (typeof window.ClassicEditor === 'undefined') {
        setTimeout(initEditor, 100)
        return
      }

      if (editorRef.current) return

      window.ClassicEditor.create(containerRef.current, {
        toolbar: [
          'heading', '|',
          'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
          'indent', 'outdent', '|',
          'blockQuote', 'insertTable', '|',
          'undo', 'redo'
        ],
        placeholder: placeholder,
        language: 'pt-br',
      }).then((editor: any) => {
        editorRef.current = editor
        isReady.current = true

        if (value) {
          editor.setData(value)
        }

        editor.model.document.on('change:data', () => {
          const data = editor.getData()
          onChangeRef.current(data)
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
