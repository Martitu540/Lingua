import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={`stat-${idx}`} className="space-y-3 rounded-xl border bg-card p-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`current-${idx}`} className="space-y-3 rounded-xl border bg-card p-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-10 flex-1 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`available-${idx}`} className="space-y-3 rounded-xl border bg-card p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  )
}
