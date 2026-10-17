import { Lock } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-surface">
        <Lock className="h-5 w-5 text-copy-muted" />
      </div>
      <h1 className="font-heading text-xl font-medium text-copy-primary">
        Access denied
      </h1>
      <p className="max-w-sm text-sm text-copy-muted">
        You do not have access to this project, or it no longer exists.
      </p>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="rounded-xl border-surface-border bg-surface text-copy-primary hover:bg-subtle"
      >
        <Link href="/editor">Back to editor</Link>
      </Button>
    </div>
  )
}
