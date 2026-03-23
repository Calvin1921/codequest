"use client"

import { useCallback, useRef, useState } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"

interface ChallengeEditorProps {
  starterCode: string
  language: string
  onSubmit: (code: string) => void
  onSave?: (code: string) => void
  isSubmitting?: boolean
  previousCode?: string
}

export function ChallengeEditor({
  starterCode,
  language,
  onSubmit,
  onSave,
  isSubmitting = false,
  previousCode,
}: ChallengeEditorProps) {
  const [code, setCode] = useState(previousCode ?? starterCode)
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor

      editor.addAction({
        id: "run-code",
        label: "Run Code",
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          const currentCode = editor.getValue()
          onSubmit(currentCode)
        },
      })
    },
    [onSubmit]
  )

  const handleRun = useCallback(() => {
    onSubmit(code)
  }, [code, onSubmit])

  const handleSave = useCallback(() => {
    onSave?.(code)
  }, [code, onSave])

  const handleReset = useCallback(() => {
    const confirmed = window.confirm(
      "Reset to starter code? Your current changes will be lost."
    )
    if (confirmed) {
      setCode(starterCode)
      editorRef.current?.setValue(starterCode)
    }
  }, [starterCode])

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-hidden rounded-t-lg border border-neutral-800">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value ?? "")}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
              <div className="size-6 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: true,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 16 },
            renderLineHighlight: "gutter",
            cursorBlinking: "smooth",
            smoothScrolling: true,
          }}
        />
      </div>

      <div className="flex items-center justify-between rounded-b-lg border border-t-0 border-neutral-800 bg-neutral-900/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRun}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-md bg-lime-500 px-4 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-lime-400 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
            {isSubmitting ? "Running..." : "Run Tests"}
          </button>

          <span className="hidden text-xs text-neutral-600 sm:block">
            Cmd+Enter to run
          </span>

          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.75 7h-3v5.296l1.943-2.048a.75.75 0 011.114 1.004l-3.25 3.5a.75.75 0 01-1.114 0l-3.25-3.5a.75.75 0 111.114-1.004l1.943 2.048V7h1.5V1.75a.75.75 0 00-1.5 0V7h-3A2.25 2.25 0 004 9.25v7.5A2.25 2.25 0 006.25 19h7.5A2.25 2.25 0 0016 16.75v-7.5A2.25 2.25 0 0013.75 7z" />
              </svg>
              Save Draft
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-md border border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.379 2.341l-1.205 1.205A.75.75 0 013.75 14.5V11.25a.75.75 0 01.75-.75h3.25a.75.75 0 01.53 1.28l-1.196 1.196a4 4 0 006.828-1.704.75.75 0 011.4.552zM4.688 8.576a5.5 5.5 0 019.379-2.341l1.205-1.205A.75.75 0 0116.25 5.5v3.25a.75.75 0 01-.75.75h-3.25a.75.75 0 01-.53-1.28l1.196-1.196a4 4 0 00-6.828 1.704.75.75 0 01-1.4-.552z" clipRule="evenodd" />
          </svg>
          Reset
        </button>
      </div>
    </div>
  )
}
