'use client'

import { useOptimistic, useTransition, useActionState } from 'react'
import { useFormStatus } from 'react-dom'

interface OptimisticFormProps<T> {
  initialData: T
  action: (prevState: any, formData: FormData) => Promise<any>
  optimisticUpdate: (current: T, formData: FormData) => T
  children: (data: T, isPending: boolean) => React.ReactNode
}

export function OptimisticForm<T>({
  initialData,
  action,
  optimisticUpdate,
  children,
}: OptimisticFormProps<T>) {
  const [optimisticData, setOptimisticData] = useOptimistic(initialData)
  const [isPending, startTransition] = useTransition()
  const [state, formAction] = useActionState(action, { errors: {} })

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      setOptimisticData(optimisticUpdate(optimisticData, formData))
      formAction(formData)
    })
  }

  return (
    <form action={handleSubmit}>
      {children(optimisticData, isPending)}
      {state?.errors && Object.keys(state.errors).length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          {Object.entries(state.errors).map(([key, value]) => (
            <p key={key} className="text-sm text-red-600">
              {key}: {value}
            </p>
          ))}
        </div>
      )}
    </form>
  )
}

export function FormButton({ 
  children, 
  loadingText = 'Loading...' 
}: { 
  children: React.ReactNode
  loadingText?: string 
}) {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {pending ? loadingText : children}
    </button>
  )
}