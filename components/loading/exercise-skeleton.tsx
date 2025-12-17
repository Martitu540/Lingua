import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function ExerciseSkeleton() {
  return (
    <div className="pt-24 px-4 max-w-2xl mx-auto space-y-6">
      <Card className="animate-pulse">
        <CardContent className="p-8 space-y-6">
          {/* Question skeleton */}
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-full" />
          
          {/* Options skeleton */}
          <div className="space-y-3 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

