import vm from 'node:vm'
import { type TestCase, type TestResult, type ExecutionResult } from './types'

const EXECUTION_TIMEOUT_MS = 5000

/**
 * Deep equality comparison for comparing test outputs.
 * Handles primitives, arrays, and plain objects.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((val, i) => deepEqual(val, b[i]))
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const aKeys = Object.keys(aObj)
    const bKeys = Object.keys(bObj)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
  }

  return false
}

/**
 * Execute user code against a set of test cases using Node.js vm module.
 *
 * The user code is expected to define a function (via function declaration
 * or assignment) that will be called with each test case's input arguments.
 *
 * For class-based challenges (e.g. LRU Cache), the test case input is
 * treated as a sequence of operations: [["method", ...args], ...] and
 * expected is an array of return values.
 */
export function executeCode(
  userCode: string,
  testCases: TestCase[],
  functionName?: string
): ExecutionResult {
  const overallStart = performance.now()
  const results: TestResult[] = []

  // First, check for syntax errors by compiling the script once
  let script: vm.Script
  try {
    script = new vm.Script(userCode, {
      filename: 'user-code.js',

    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return {
      passed: false,
      results: [],
      totalTests: testCases.length,
      passedTests: 0,
      error: `Compilation error: ${error}`,
      executionTimeMs: performance.now() - overallStart,
    }
  }

  for (const testCase of testCases) {
    const testStart = performance.now()
    const result: TestResult = {
      description: testCase.description,
      input: testCase.input,
      expected: testCase.expected,
      actual: undefined,
      passed: false,
      executionTimeMs: 0,
    }

    try {
      // Create a fresh sandboxed context for each test case
      const sandbox: Record<string, unknown> = {
        console: { log: () => {}, error: () => {}, warn: () => {} },
      }
      // vm.createContext provides isolated builtins automatically

      const context = vm.createContext(sandbox)

      // Run user code to define the function(s) in the sandbox
      script.runInContext(context, { timeout: EXECUTION_TIMEOUT_MS })

      // Determine which function to call
      const fnName = functionName || detectFunctionName(userCode)
      if (!fnName) {
        result.error = 'Could not detect exported function name in your code'
        result.executionTimeMs = performance.now() - testStart
        results.push(result)
        continue
      }

      const fn = sandbox[fnName]

      // Handle class-based challenges (input is array of method calls)
      if (typeof fn === 'function' && isClassChallenge(testCase)) {
        const operations = testCase.input as unknown as [string, ...unknown[]][]
        const expectedResults = testCase.expected as unknown[]

        const callScript = new vm.Script(
          `
          (function() {
            const instance = new ${fnName}(${JSON.stringify(operations[0].slice(1)).slice(1, -1)});
            const results = [null];
            for (let i = 1; i < ${JSON.stringify(operations)}.length; i++) {
              const [method, ...args] = ${JSON.stringify(operations)}[i];
              const ret = instance[method](...args);
              results.push(ret === undefined ? null : ret);
            }
            return results;
          })()
          `,
          
        )

        result.actual = callScript.runInContext(context, {
          timeout: EXECUTION_TIMEOUT_MS,
        })
        result.passed = deepEqual(result.actual, expectedResults)
      } else if (typeof fn === 'function') {
        // Standard function call
        const callScript = new vm.Script(
          `${fnName}(${testCase.input.map((arg) => JSON.stringify(arg)).join(', ')})`,
        )

        result.actual = callScript.runInContext(context, {
          timeout: EXECUTION_TIMEOUT_MS,
        })
        result.passed = deepEqual(result.actual, testCase.expected)
      } else {
        result.error = `"${fnName}" is not defined as a function`
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Script execution timed out')) {
          result.error =
            'Execution timed out (possible infinite loop or excessive computation)'
        } else {
          result.error = `Runtime error: ${err.message}`
        }
      } else {
        result.error = `Runtime error: ${String(err)}`
      }
    }

    result.executionTimeMs = performance.now() - testStart
    results.push(result)
  }

  const passedTests = results.filter((r) => r.passed).length
  return {
    passed: passedTests === testCases.length,
    results,
    totalTests: testCases.length,
    passedTests,
    executionTimeMs: performance.now() - overallStart,
  }
}

/**
 * Detect the main function name from user code.
 * Looks for function functionName or const/let/var functionName =.
 */
function detectFunctionName(code: string): string | null {
  // Match function name( declarations
  const fnMatch = code.match(/function\s+([a-zA-Z_\$][a-zA-Z0-9_\$]*)\s*\(/)
  if (fnMatch) return fnMatch[1]

  // Match class Name declarations
  const classMatch = code.match(/class\s+([a-zA-Z_\$][a-zA-Z0-9_\$]*)/)
  if (classMatch) return classMatch[1]

  // Match const/let/var name = function or arrow
  const varMatch = code.match(
    /(?:const|let|var)\s+([a-zA-Z_\$][a-zA-Z0-9_\$]*)\s*=/
  )
  if (varMatch) return varMatch[1]

  return null
}

/**
 * Heuristic to detect class-based challenges:
 * input is an array of arrays where each sub-array starts with a string (method name).
 */
function isClassChallenge(testCase: TestCase): boolean {
  return (
    Array.isArray(testCase.input) &&
    testCase.input.length > 0 &&
    Array.isArray(testCase.input[0]) &&
    typeof testCase.input[0][0] === 'string' &&
    Array.isArray(testCase.expected)
  )
}
