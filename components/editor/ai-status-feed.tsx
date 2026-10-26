"use client"

import { useEffect, useState } from "react"
import { Bot } from "lucide-react"
import { useEventListener } from "@liveblocks/react/suspense"

import type { AiStatusEvent, AiStatusPhase } from "@/lib/ai-room"
import { cn } from "@/lib/utils"

interface StatusItem {
  id: number
  phase: AiStatusPhase
  message: string
}

const MAX_ITEMS = 4

export function AiStatusFeed() {
  const [items, setItems] = useState<StatusItem[]>([])

  useEventListener(({ event }) => {
    const status = event as AiStatusEvent
    if (status.type !== "AI_STATUS") return

    setItems((current) => {
      const next: StatusItem[] = [
        ...current,
        {
          id: (current.at(-1)?.id ?? 0) + 1,
          phase: status.phase,
          message: status.message,
        },
      ]
      return next.slice(-MAX_ITEMS)
    })
  })

  useEffect(() => {
    const latest = items.at(-1)
    if (!latest || latest.phase === "processing" || latest.phase === "start") {
      return
    }

    const timeout = window.setTimeout(() => {
      setItems([])
    }, 6_000)

    return () => window.clearTimeout(timeout)
  }, [items])

  if (items.length === 0) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none flex max-w-sm flex-col gap-2"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-2 rounded-2xl border px-3 py-2 text-sm shadow-lg backdrop-blur-sm",
            item.phase === "error"
              ? "border-state-error/40 bg-surface/95 text-state-error"
              : "border-ai/30 bg-surface/95 text-ai-text",
          )}
        >
          <Bot className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="leading-snug text-copy-primary">{item.message}</p>
        </div>
      ))}
    </div>
  )
}
