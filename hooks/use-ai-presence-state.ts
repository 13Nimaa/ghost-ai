"use client"

import { useEffect, useState } from "react"
import {
  useEventListener,
  useMyPresence,
  useOthers,
} from "@liveblocks/react/suspense"

import {
  validateAiStatusMessage,
  type ValidatedAiStatus,
} from "@/types/tasks"

export function useAiPresenceState() {
  const others = useOthers()
  const [myPresence, updateMyPresence] = useMyPresence()
  const [latestStatus, setLatestStatus] = useState<ValidatedAiStatus | null>(null)

  useEventListener(({ event }) => {
    const validated = validateAiStatusMessage(event)
    if (!validated) return

    setLatestStatus(validated)
  })

  useEffect(() => {
    if (
      !latestStatus ||
      latestStatus.phase === "processing" ||
      latestStatus.phase === "start"
    ) {
      return
    }

    const timeout = window.setTimeout(() => {
      setLatestStatus(null)
    }, 6_000)

    return () => window.clearTimeout(timeout)
  }, [latestStatus])

  const othersThinking = others.some(
    (other) => other.presence?.thinking === true,
  )
  const isSelfThinking = myPresence?.thinking === true
  const isFeedActive =
    latestStatus?.phase === "start" || latestStatus?.phase === "processing"
  const isAiActive = othersThinking || isSelfThinking || isFeedActive

  const setThinking = (thinking: boolean) => {
    updateMyPresence({ thinking })
  }

  return {
    latestStatus,
    isAiActive,
    othersThinking,
    isSelfThinking,
    setThinking,
    clearLatestStatus: () => setLatestStatus(null),
  }
}
