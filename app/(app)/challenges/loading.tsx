import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ChallengesLoading() {
  return (
    <div>
      <div className="mb-8">
        <div className="bg-muted h-9 w-48 animate-pulse rounded" />
        <div className="bg-muted mt-2 h-5 w-80 animate-pulse rounded" />
      </div>

      {/* Filter bar skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <div className="bg-muted h-8 w-20 animate-pulse rounded" />
          <div className="bg-muted h-8 w-16 animate-pulse rounded" />
          <div className="bg-muted h-8 w-20 animate-pulse rounded" />
          <div className="bg-muted h-8 w-16 animate-pulse rounded" />
        </div>
        <div className="flex gap-2">
          <div className="bg-muted h-8 w-16 animate-pulse rounded" />
          <div className="bg-muted h-8 w-24 animate-pulse rounded" />
          <div className="bg-muted h-8 w-24 animate-pulse rounded" />
          <div className="bg-muted h-8 w-24 animate-pulse rounded" />
          <div className="bg-muted h-8 w-16 animate-pulse rounded" />
        </div>
      </div>

      {/* Progress skeleton */}
      <div className="bg-muted mb-6 h-5 w-32 animate-pulse rounded" />

      {/* Card grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="bg-muted h-6 w-3/4 animate-pulse rounded" />
                <div className="bg-muted h-5 w-16 animate-pulse rounded-full" />
              </div>
              <div className="mt-2 space-y-2">
                <div className="bg-muted h-4 w-full animate-pulse rounded" />
                <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                <div className="bg-muted h-4 w-16 animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
