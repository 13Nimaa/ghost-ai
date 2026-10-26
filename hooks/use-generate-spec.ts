"use client"

import { useCallback, useRef, useState } from "react"
import { useFeedMessages } from "@liveblocks/react"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useRealtimeRun } from "@trigger.dev/react-hooks"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import {
  AI_CHAT_FEED,
  type AiChatMessage,
  validateAiChatMessage,
} from "@/types/tasks"

interface ActiveSpecRun {
  runId: string
  publicToken: string
}

const TERMINAL_RUN_STATUSES = new Set([
  "COMPLETED",
  "CANCELED",
  "CRASHED",
  "EXPIRED",
  "FAILED",
  "SYSTEM_FAILURE",
  "TIMED_OUT",
])

function readStringField(value: unknown, field: string): string | null {
  if (typeof value !== "object" || value === null || !(field in value)) {
    return null
  }

  const fieldValue = (value as Record<string, unknown>)[field]
  return typeof fieldValue === "string" && fieldValue.trim().length > 0
    ? fieldValue.trim()
    : null
}

function collectChatHistory(
  messages: ReadonlyArray<{ data: unknown }>,
): AiChatMessage[] {
  return messages
    .map((message) => validateAiChatMessage(message.data))
    .filter((message): message is AiChatMessage => message !== null)
}

export interface GenerateSpecController {
  isGenerating: boolean
  error: string | null
  generate: () => Promise<void>
}

export function useGenerateSpec(
  projectId: string,
  onComplete: () => void,
): GenerateSpecController {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRun, setActiveRun] = useState<ActiveSpecRun | null>(null)
  const completedRunRef = useRef<string | null>(null)

  const { nodes, edges } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
  })
  const feedResult = useFeedMessages(AI_CHAT_FEED, { limit: 100 })

  const finishRun = useCallback(
    (runId: string, succeeded: boolean) => {
      if (completedRunRef.current === runId) return
      completedRunRef.current = runId
      setActiveRun(null)
      setIsSubmitting(false)

      if (succeeded) {
        setError(null)
        onComplete()
        return
      }

      setError("Spec generation failed. Please try again.")
    },
    [onComplete],
  )

  const handleRunComplete = useCallback(
    (completedRun: { id: string; status: string }, runError?: Error) => {
      if (!runError && !TERMINAL_RUN_STATUSES.has(completedRun.status)) return

      finishRun(
        completedRun.id,
        !runError && completedRun.status === "COMPLETED",
      )
    },
    [finishRun],
  )

  useRealtimeRun(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: activeRun !== null,
    onComplete: handleRunComplete,
    skipColumns: ["payload"],
  })

  const generate = useCallback(async () => {
    if (isSubmitting || activeRun !== null) return

    setIsSubmitting(true)
    setError(null)

    try {
      const feedMessages =
        ("messages" in feedResult ? feedResult.messages : []) ?? []
      const chatHistory = collectChatHistory(feedMessages)

      const specResponse = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: projectId,
          chatHistory,
          nodes,
          edges,
        }),
      })
      const specBody: unknown = await specResponse.json().catch(() => null)
      const runId = readStringField(specBody, "runId")

      if (!specResponse.ok || !runId) {
        throw new Error("Could not start the spec run")
      }

      const tokenResponse = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      })
      const tokenBody: unknown = await tokenResponse.json().catch(() => null)
      const publicToken = readStringField(tokenBody, "token")

      if (!tokenResponse.ok || !publicToken) {
        throw new Error("Could not connect to the spec run")
      }

      completedRunRef.current = null
      setActiveRun({ runId, publicToken })
    } catch {
      setError("Could not start spec generation. Please try again.")
      setIsSubmitting(false)
    }
  }, [activeRun, edges, feedResult, isSubmitting, nodes, projectId])

  return {
    isGenerating: isSubmitting || activeRun !== null,
    error,
    generate,
  }
}
