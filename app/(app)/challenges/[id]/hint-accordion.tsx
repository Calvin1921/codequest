"use client"

import { useState } from "react"
import { getHint } from "@/server/actions/challenges"
import { Button } from "@/components/ui/button"

export function HintAccordion({
  challengeId,
  totalHints,
}: {
  challengeId: string
  totalHints: number
}) {
  const [revealedHints, setRevealedHints] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const revealedCount = revealedHints.length
  const hasMore = revealedCount < totalHints

  async function revealNextHint() {
    setLoading(true)
    try {
      const result = await getHint(challengeId, revealedCount)
      if ("hint" in result && result.hint) {
        setRevealedHints((prev) => [...prev, result.hint!])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {revealedHints.map((hint, i) => (
        <div
          key={i}
          className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30"
        >
          <p className="mb-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Hint {i + 1}
          </p>
          <p className="text-amber-900 dark:text-amber-200">{hint}</p>
        </div>
      ))}

      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={revealNextHint}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : revealedCount === 0
              ? "Show Hint 1"
              : `Show Hint ${revealedCount + 1}`}
        </Button>
      )}

      {!hasMore && revealedCount > 0 && (
        <p className="text-xs text-muted-foreground">All hints revealed</p>
      )}
    </div>
  )
}
