import type { ExecutionResult } from '@/lib/types'
import { TestResults } from '@/components/test-results'

interface ResultsPanelProps {
  executionResult: ExecutionResult | null
  executionError: string | null
  xpAwarded: number
}

export function ResultsPanel({ executionResult, executionError, xpAwarded }: ResultsPanelProps) {
  return (
    <>
      {executionError && (
        <div className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
          <p className="font-semibold text-red-400">Error</p>
          <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded bg-red-950/50 p-3 font-mono text-xs leading-5 text-red-300">
            {executionError}
          </pre>
        </div>
      )}

      {executionResult && executionResult.results.length > 0 ? (
        <TestResults
          results={executionResult.results}
          passed={executionResult.passed}
          totalTests={executionResult.totalTests}
          passedTests={executionResult.passedTests}
          xpAwarded={xpAwarded}
        />
      ) : !executionError ? (
        <p className="py-6 text-center text-sm text-neutral-600">
          Run tests to see results here
        </p>
      ) : null}
    </>
  )
}
