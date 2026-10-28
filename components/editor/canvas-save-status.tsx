import { Check, Loader2, Save, TriangleAlert } from "lucide-react"

import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"
import { cn } from "@/lib/utils"

interface CanvasSaveStatusIndicatorProps {
  status: CanvasSaveStatus
}

export function CanvasSaveStatusIndicator({
  status,
}: CanvasSaveStatusIndicatorProps) {
  const isSaving = status === "saving"
  const isError = status === "error"

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium",
        isError
          ? "border-state-error/40 bg-elevated text-state-error"
          : "border-surface-border bg-elevated text-copy-primary",
      )}
    >
      {isSaving ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : isError ? (
        <TriangleAlert className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Save className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{isError ? "Save failed" : isSaving ? "Saving…" : "Save"}</span>
    </span>
  )
}
