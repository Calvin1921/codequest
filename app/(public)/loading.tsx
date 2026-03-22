import { Skeleton } from '@/components/ui/skeleton'

export default function PublicLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-32 mx-auto" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3 mx-auto" />
      </div>
    </div>
  )
}
