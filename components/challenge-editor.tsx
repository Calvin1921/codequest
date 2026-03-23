"use client"

import { useCallback, useRef, useState } from "react"
import Editor, { type OnMount } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, Save, RotateCcw } from "lucide-react"

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
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border">
        <Editor
          height="400px"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value ?? "")}
          onMount={handleEditorDidMount}
          loading={<Skeleton className="h-[400px] w-full" />}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            padding: { top: 12 },
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleRun} disabled={isSubmitting} size="sm">
          <Play />
          {isSubmitting ? "Running..." : "Run (Cmd+Enter)"}
        </Button>

        {onSave && (
          <Button onClick={handleSave} variant="outline" size="sm">
            <Save />
            Save Draft
          </Button>
        )}

        <Button
          onClick={handleReset}
          variant="ghost"
          size="sm"
          className="ml-auto"
        >
          <RotateCcw />
          Reset
        </Button>
      </div>
    </div>
  )
}
