'use client'

import { useRef, useCallback } from 'react'

interface RichTextEmailEditorProps {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
}

type FormatCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault() // prevent editor losing focus
        onClick()
      }}
      title={title}
      className="p-1.5 rounded hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
    >
      {children}
    </button>
  )
}

export default function RichTextEmailEditor({
  value,
  onChange,
  disabled = false,
}: RichTextEmailEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const execFormat = useCallback((command: FormatCommand) => {
    document.execCommand(command, false)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
    editorRef.current?.focus()
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInsertLink = useCallback(() => {
    const url = window.prompt('Enter URL:')
    if (url) {
      document.execCommand('createLink', false, url)
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    }
    editorRef.current?.focus()
  }, [onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    // Strip rich formatting from pastes — only keep plain text
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex-wrap">
        <ToolbarButton onClick={() => execFormat('bold')} title="Bold">
          <svg className="w-4 h-4 font-bold" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a1 1 0 011-1h4.5a3.5 3.5 0 011.852 6.47A3.5 3.5 0 0110.5 17H6a1 1 0 01-1-1V4zm2 1v4h3.5a1.5 1.5 0 000-3H7zm0 6v4h3.5a1.5 1.5 0 000-3H7z" />
          </svg>
        </ToolbarButton>

        <ToolbarButton onClick={() => execFormat('italic')} title="Italic">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 3a1 1 0 000 2h1.323l-3.646 10H4a1 1 0 100 2h8a1 1 0 100-2h-1.323l3.646-10H16a1 1 0 100-2H8z" />
          </svg>
        </ToolbarButton>

        <ToolbarButton onClick={() => execFormat('underline')} title="Underline">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 3a1 1 0 011 1v5a3 3 0 006 0V4a1 1 0 112 0v5a5 5 0 01-10 0V4a1 1 0 011-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
          </svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => execFormat('insertUnorderedList')} title="Bullet list">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 5a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1zm-3 5a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1zm-3 5a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <ToolbarButton onClick={() => execFormat('insertOrderedList')} title="Numbered list">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 000 2h.01a1 1 0 000-2H3zm0 5a1 1 0 000 2h.01a1 1 0 000-2H3zm0 5a1 1 0 000 2h.01a1 1 0 000-2H3zM7 5a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1zm0 5a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1zm0 5a1 1 0 011-1h9a1 1 0 110 2H8a1 1 0 01-1-1z" />
          </svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolbarButton onClick={handleInsertLink} title="Insert link">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
        </ToolbarButton>

        <div className="ml-auto text-xs text-gray-400 pr-1 hidden sm:block">
          Use <code className="bg-gray-100 px-1 rounded">{'{{firstName}}'}</code> to personalize
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        className="min-h-[220px] p-4 focus:outline-none text-gray-800 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-orange-600 [&_a]:underline"
        data-placeholder="Write your message here…"
        style={{
          // Show placeholder when empty via CSS
        }}
      />

      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
