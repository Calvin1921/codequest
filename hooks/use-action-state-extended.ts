'use client'

import { useActionState, useOptimistic, useTransition } from 'react'
import { useCallback } from 'react'

interface ActionState<T> {
  data?: T
  error?: string
  errors?: Record<string, string[]>
  success?: boolean
}

interface UseActionStateExtendedOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  optimisticUpdate?: (current: T | undefined, formData: FormData) => T
}

export function useActionStateExtended<T>(
  action: (prevState: ActionState<T>, formData: FormData) => Promise<ActionState<T>>,
  initialState: ActionState<T> = {},
  options: UseActionStateExtendedOptions<T> = {}
) {
  const [state, formAction] = useActionState(action, initialState)
  const [optimisticData, setOptimisticData] = useOptimistic(state.data)
  const [isPending, startTransition] = useTransition()

  const execute = useCallback((formData: FormData) => {
    startTransition(() => {
      if (options.optimisticUpdate) {
        setOptimisticData(options.optimisticUpdate(optimisticData, formData))
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- useActionState return type does not expose .then()
      ;(formAction(formData) as any)?.then?.((result: ActionState<T>) => {
        if (result.success && result.data && options.onSuccess) {
          options.onSuccess(result.data)
        } else if (result.error && options.onError) {
          options.onError(result.error)
        }
      })
    })
  }, [formAction, optimisticData, options, setOptimisticData])

  return {
    state: {
      ...state,
      data: optimisticData || state.data,
    },
    execute,
    isPending,
    isError: !!state.error || (state.errors && Object.keys(state.errors).length > 0),
    isSuccess: state.success === true,
  }
}
