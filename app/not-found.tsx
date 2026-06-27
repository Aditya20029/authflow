import Link from "next/link"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/primitives/page-container"

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Compass className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold">Page not found</h2>
          <p className="mx-auto max-w-md text-pretty text-sm text-muted-foreground">
            The request or page you are looking for does not exist. It may have
            been removed, or the link may be incorrect.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/worklist">Go to worklist</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}
