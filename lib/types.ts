/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TestCase {
  input: any[] // arguments to pass to the function
  expected: any
  description: string
}

export interface TestResult {
  description: string
  input: any[]
  expected: any
  actual: any
  passed: boolean
  error?: string
  executionTimeMs: number
}

export interface ExecutionResult {
  passed: boolean
  results: TestResult[]
  totalTests: number
  passedTests: number
  error?: string
  executionTimeMs: number
}
