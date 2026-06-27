"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/primitives/page-container"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageContainer>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold">
            This screen could not load
          </h2>
          <p className="mx-auto max-w-md text-pretty text-sm text-muted-foreground">
            A data request did not complete. Retry to reload this view, or return
            to the dashboard.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={reset}>Retry</Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}
