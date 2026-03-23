"use client"

import type { TestResult } from "@/lib/types"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CheckCircle2, XCircle } from "lucide-react"
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
    <div className="flex flex-col gap-4">
      {/* Summary bar */}
      <div
        className={cn(
          "flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium",
          passed
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        )}
      >
        <div className="flex items-center gap-2">
          {passed ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <XCircle className="size-5" />
          )}
          <span>
            {passedTests}/{totalTests} tests passed
          </span>
        </div>
        {xpAwarded !== undefined && xpAwarded > 0 && (
          <span className="font-semibold">+{xpAwarded} XP</span>
        )}
      </div>

      {/* Individual test cards */}
      <div className="flex flex-col gap-2">
        {results.map((result, index) => (
          <Card key={index} className="py-3">
            <CardHeader className="px-4 py-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                {result.passed ? (
                  <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="size-4 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={cn(
                    result.passed
                      ? "text-green-800 dark:text-green-400"
                      : "text-red-800 dark:text-red-400"
                  )}
                >
                  {result.description}
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {result.executionTimeMs}ms
                </span>
              </CardTitle>
            </CardHeader>
            {!result.passed && (
              <CardContent className="px-4 pb-0 pt-2">
                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">
                      Input
                    </p>
                    <pre className="bg-muted overflow-x-auto rounded p-2">
                      {JSON.stringify(result.input, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">
                      Expected
                    </p>
                    <pre className="overflow-x-auto rounded bg-green-50 p-2 dark:bg-green-900/20">
                      {JSON.stringify(result.expected, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 font-medium">
                      Actual
                    </p>
                    <pre className="overflow-x-auto rounded bg-red-50 p-2 dark:bg-red-900/20">
                      {result.error
                        ? result.error
                        : JSON.stringify(result.actual, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
