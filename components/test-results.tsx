"use client"

import { useState } from "react"
import type { TestResult } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TestResultsProps {
  results: TestResult[]
  passed: boolean
  xpAwarded?: number
  totalTests: number
  passedTests: number
}

export function TestResults({
  results,
  passed,
  xpAwarded,
  totalTests,
  passedTests,
}: TestResultsProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold",
          passed
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
        )}
      >
        <div className="flex items-center gap-2">
          {passed ? (
            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          )}
          <span>
            {passedTests}/{totalTests} tests passed
          </span>
        </div>
        {xpAwarded !== undefined && xpAwarded > 0 && (
          <span className="font-mono text-sm tabular-nums text-lime-500">+{xpAwarded} XP</span>
        )}
      </div>

      {/* Individual test rows */}
      <div className="flex flex-col gap-1">
        {results.map((result, index) => (
          <TestRow key={index} result={result} />
        ))}
      </div>
    </div>
  )
}

function TestRow({ result }: { result: TestResult }) {
  const [expanded, setExpanded] = useState(!result.passed)

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        result.passed
          ? "border-neutral-800 bg-neutral-900/50"
          : "border-red-500/20 bg-red-500/5"
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm"
        onClick={() => setExpanded((v) => !v)}
      >
        {result.passed ? (
          <svg className="size-4 shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="size-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        )}
        <span
          className={cn(
            "flex-1 font-medium",
            result.passed ? "text-neutral-300" : "text-red-300"
          )}
        >
          {result.description}
        </span>
        <span className="font-mono text-xs text-neutral-600">
          {result.executionTimeMs}ms
        </span>
        {!result.passed && (
          <svg
            className={cn(
              "size-4 text-neutral-500 transition-transform",
              expanded && "rotate-180"
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {!result.passed && expanded && (
        <div className="border-t border-red-500/10 px-3 pb-3 pt-2">
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <div>
              <p className="mb-1 font-medium text-neutral-500">Input</p>
              <pre className="overflow-x-auto rounded bg-neutral-900 p-2 font-mono text-neutral-300">
                {JSON.stringify(result.input, null, 2)}
              </pre>
            </div>
            <div>
              <p className="mb-1 font-medium text-neutral-500">Expected</p>
              <pre className="overflow-x-auto rounded bg-green-900/20 p-2 font-mono text-green-300">
                {JSON.stringify(result.expected, null, 2)}
              </pre>
            </div>
            <div>
              <p className="mb-1 font-medium text-neutral-500">Actual</p>
              <pre className="overflow-x-auto rounded bg-red-900/20 p-2 font-mono text-red-300">
                {result.error
                  ? result.error
                  : JSON.stringify(result.actual, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
