interface TestCaseListProps {
  testCases: Array<{ input: unknown[]; expected: unknown; description: string }>
  limit?: number
  total?: number
}

export function TestCaseList({ testCases, limit, total }: TestCaseListProps) {
  const displayed = limit ? testCases.slice(0, limit) : testCases
  const displayTotal = total ?? testCases.length

  return (
    <div className="space-y-3">
      {displayed.map((tc, i) => (
        <div
          key={i}
          className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4"
        >
          <p className="mb-1 text-xs font-medium text-neutral-500">
            {tc.description}
          </p>
          <pre className="overflow-x-auto font-mono text-xs leading-5 text-neutral-300">
            <span className="text-zinc-500">Input:    </span>
            {JSON.stringify(tc.input)}
            {'\n'}
            <span className="text-zinc-500">Expected: </span>
            <span className="text-lime-400">
              {JSON.stringify(tc.expected)}
            </span>
          </pre>
        </div>
      ))}
      {displayTotal === 0 && (
        <p className="text-sm text-neutral-600">No test cases available.</p>
      )}
    </div>
  )
}
