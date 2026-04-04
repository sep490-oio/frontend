import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  maxLength?: number
}

const TOOLBAR_OPTIONS = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean'],
]

const FORMATS = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'blockquote', 'code-block',
  'link', 'image',
]

export function RichTextEditor({ value, onChange, placeholder, maxLength }: RichTextEditorProps) {
  const handleChange = (content: string) => {
    // react-quill returns '<p><br></p>' for empty content
    const isEmpty = content === '<p><br></p>' || content === '<p></p>' || !content.trim()
    const sanitizedValue = isEmpty ? '' : content

    if (maxLength && sanitizedValue.replace(/<[^>]*>/g, '').length > maxLength) {
      return // don't update if plain text exceeds max
    }

    onChange?.(sanitizedValue)
  }

  return (
    <div className="oio-rich-editor">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        modules={{ toolbar: TOOLBAR_OPTIONS }}
        formats={FORMATS}
      />
      <style>{`
        .oio-rich-editor .ql-container {
          min-height: 150px;
          font-size: 14px;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        .oio-rich-editor .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          background: var(--color-bg-surface, #f9fafb);
        }
        .oio-rich-editor .ql-editor {
          min-height: 150px;
          line-height: 1.8;
        }
        .oio-rich-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: var(--color-text-secondary, #9ca3af);
        }
      `}</style>
    </div>
  )
}
