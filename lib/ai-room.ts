import { getCursorColor, getLiveblocksClient } from "@/lib/liveblocks"

export const AI_USER_ID = "ghost-ai"

export const AI_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#6457F9",
} as const

export type AiStatusPhase = "start" | "processing" | "complete" | "error"

export interface AiStatusEvent {
  type: "AI_STATUS"
  phase: AiStatusPhase
  message: string
}

const PRESENCE_TTL_SECONDS = 120
const CLEAR_PRESENCE_TTL_SECONDS = 2

export async function setAiPresence(
  roomId: string,
  data: {
    cursor: { x: number; y: number } | null
    thinking: boolean
  },
  ttl = PRESENCE_TTL_SECONDS,
): Promise<void> {
  const client = getLiveblocksClient()

  await client.setPresence(roomId, {
    userId: AI_USER_ID,
    data,
    userInfo: {
      ...AI_USER_INFO,
      color: AI_USER_INFO.color || getCursorColor(AI_USER_ID),
    },
    ttl,
  })
}

export async function clearAiPresence(roomId: string): Promise<void> {
  await setAiPresence(
    roomId,
    { cursor: null, thinking: false },
    CLEAR_PRESENCE_TTL_SECONDS,
  )
}

export async function publishAiStatus(
  roomId: string,
  phase: AiStatusPhase,
  message: string,
): Promise<void> {
  const client = getLiveblocksClient()
  const event: AiStatusEvent = { type: "AI_STATUS", phase, message }
  await client.broadcastEvent(roomId, event)
}
