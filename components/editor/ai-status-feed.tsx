"use client"

import { useFeedMessages } from "@liveblocks/react"
import { Bot, Loader2 } from "lucide-react"

import { useAiPresenceState } from "@/hooks/use-ai-presence-state"
import { cn } from "@/lib/utils"
import { AI_STATUS_FEED, validateAiStatusMessage } from "@/types/tasks"

export { useAiPresenceState }

interface AiStatusFeedProps {
  variant?: "canvas" | "sidebar"
  active?: boolean
  className?: string
}

export function AiStatusFeed({
  variant = "canvas",
  active,
  className,
}: AiStatusFeedProps) {
  const { latestStatus, isAiActive } = useAiPresenceState()
  const feedResult = useFeedMessages(AI_STATUS_FEED, { limit: 20 })
  const feedMessages = ("messages" in feedResult ? feedResult.messages : []) ?? []
  const latestFeedStatus = feedMessages
    .map((message) => ({
      status: validateAiStatusMessage(message.data),
      createdAt: message.createdAt,
    }))
    .filter(
      (message): message is {
        status: NonNullable<ReturnType<typeof validateAiStatusMessage>>
        createdAt: number
      } => message.status !== null,
    )
    .sort((first, second) => second.createdAt - first.createdAt)[0]?.status

  if (variant === "sidebar" && !active) {
    return null
  }

  const statusForDisplay = variant === "sidebar" ? latestFeedStatus : latestStatus

  const displayMessage =
    statusForDisplay?.displayMessage ??
    (isAiActive || active ? "Ghost AI is working…" : "")
  const statusPhase =
    statusForDisplay?.phase ??
    (isAiActive ? "processing" : null)
  const isActive = active ?? isAiActive

  if (!displayMessage && !isAiActive) {
    return null
  }

  if (variant === "sidebar") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs backdrop-blur-sm transition-all",
          statusPhase === "error"
            ? "border-state-error/30 bg-state-error/10 text-state-error"
            : isActive
              ? "border-state-success/40 bg-elevated text-state-success"
              : "border-surface-border bg-elevated text-copy-muted",
          className,
        )}
      >
        {isActive ? (
          <Loader2
            className="h-3.5 w-3.5 shrink-0 animate-spin text-state-success"
            aria-hidden
          />
        ) : (
          <Bot className="h-3.5 w-3.5 shrink-0 text-ai-text" aria-hidden />
        )}
        <p className="min-w-0 flex-1 truncate font-medium text-copy-primary">
          {displayMessage}
        </p>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none flex max-w-sm flex-col gap-2",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2 rounded-2xl border px-3 py-2 text-sm shadow-lg backdrop-blur-sm",
          statusPhase === "error"
            ? "border-state-error/40 bg-surface/95 text-state-error"
            : "border-ai/30 bg-surface/95 text-ai-text",
        )}
      >
        {isAiActive ? (
          <Loader2
            className="mt-0.5 h-4 w-4 shrink-0 animate-spin"
            aria-hidden
          />
        ) : (
          <Bot className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        )}
        <p className="leading-snug text-copy-primary">{displayMessage}</p>
      </div>
    </div>
  )
}
