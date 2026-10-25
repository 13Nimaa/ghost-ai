import { Check, Loader2, TriangleAlert } from "lucide-react"

import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave"
import { cn } from "@/lib/utils"

interface CanvasSaveStatusIndicatorProps {
  status: CanvasSaveStatus
}

const STATUS_LABELS: Record<Exclude<CanvasSaveStatus, "idle">, string> = {
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
}

export function CanvasSaveStatusIndicator({
  status,
}: CanvasSaveStatusIndicatorProps) {
  if (status === "idle") {
    return null
  }

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        status === "error"
          ? "text-state-error"
          : status === "saved"
            ? "text-state-success"
            : "text-copy-muted",
      )}
    >
      {status === "saving" ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      {status === "saved" ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : null}
      {status === "error" ? (
        <TriangleAlert className="h-4 w-4" aria-hidden="true" />
      ) : null}
      <span>{STATUS_LABELS[status]}</span>
    </span>
  )
}
