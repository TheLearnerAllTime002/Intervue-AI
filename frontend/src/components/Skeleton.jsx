import { useEffect, useState } from "react"

function DelayedSkeletonContent({ delay, children }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), delay)
    return () => window.clearTimeout(timer)
  }, [delay])

  return visible ? children : null
}

export function DelayedSkeleton({ active, delay = 180, children }) {
  if (!active) return null
  return <DelayedSkeletonContent delay={delay}>{children}</DelayedSkeletonContent>
}

export function Skeleton({ className = "" }) {
  return <span aria-hidden="true" className={`skeleton-shimmer block ${className}`} />
}

export function PageSkeleton({ variant = "content" }) {
  const isInterview = variant === "interview"

  return (
    <main aria-label="Loading page" aria-busy="true" className="min-h-screen bg-[var(--neo-paper)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className={`grid gap-5 ${isInterview ? "lg:grid-cols-[minmax(0,1fr)_280px]" : "md:grid-cols-[minmax(0,1.3fr)_minmax(240px,.7fr)]"}`}>
          <section className="space-y-5 border-2 border-black bg-white p-5 shadow-[5px_5px_0_#171717] sm:p-8">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-10 w-4/5 max-w-xl" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-4 w-3/4 max-w-md" />
            <div className="grid gap-3 pt-5 sm:grid-cols-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </section>
          <section className="space-y-4 border-2 border-black bg-sky-100 p-5 shadow-[5px_5px_0_#171717]">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-full" />
          </section>
        </div>
      </div>
    </main>
  )
}

export function ListSkeleton({ count = 3 }) {
  return (
    <div aria-label="Loading content" aria-busy="true" className="mt-6 space-y-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-2 border-black bg-white p-4 shadow-[3px_3px_0_#171717]">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-3/4" /></div>
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  )
}
