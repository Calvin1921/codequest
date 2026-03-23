"use client"

import { useCallback, useRef, useState, useImperativeHandle, forwardRef } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"

export interface ChallengeEditorHandle {
  getCode: () => string
  reset: () => void
}

interface ChallengeEditorProps {
  starterCode: string
  language: string
  onSubmit: (code: string) => void
  onSave?: (code: string) => void
  isSubmitting?: boolean
  previousCode?: string
}

export const ChallengeEditor = forwardRef<ChallengeEditorHandle, ChallengeEditorProps>(
  function ChallengeEditor(
    {
      starterCode,
      language,
      onSubmit,
      previousCode,
    },
    ref
  ) {
    const [code, setCode] = useState(previousCode ?? starterCode)
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

    useImperativeHandle(ref, () => ({
      getCode: () => code,
      reset: () => {
        const confirmed = window.confirm(
          "Reset to starter code? Your current changes will be lost."
        )
        if (confirmed) {
          setCode(starterCode)
          editorRef.current?.setValue(starterCode)
        }
      },
    }), [code, starterCode])

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

    return (
      <div className="h-full">
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
    )
  }
)
