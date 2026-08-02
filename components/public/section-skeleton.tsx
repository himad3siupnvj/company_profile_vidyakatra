import { Skeleton } from "@/components/ui/skeleton"

type SectionSkeletonProps = {
  variant?: "default" | "hero"
}

export function SectionSkeleton({ variant = "default" }: SectionSkeletonProps) {
  if (variant === "hero") {
    return (
      <section className="relative overflow-hidden border-b border-border bg-muted/40">
        <Skeleton className="mx-auto aspect-[21/9] w-full max-w-7xl rounded-none border-b border-border/50" />
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden border-y border-border/50 bg-muted/30 py-12 md:py-16">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="mt-4 h-6 w-full max-w-xl" />
        <Skeleton className="mt-2 h-6 w-2/3 max-w-md" />
      </div>
    </section>
  )
}
