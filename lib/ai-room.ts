import { getCursorColor, getLiveblocksClient } from "@/lib/liveblocks"
import {
  AI_STATUS_FEED,
  type AiStatusFeedPayload,
  type AiStatusPhase,
} from "@/types/tasks"

export const AI_USER_ID = "ghost-ai"

export const AI_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#6457F9",
} as const

export type { AiStatusPhase }
export { AI_STATUS_FEED }

export interface AiStatusEvent extends AiStatusFeedPayload {
  type: "AI_STATUS"
  feed: typeof AI_STATUS_FEED
  phase: AiStatusPhase
  message: string
  text?: string
}

export async function ensureAiStatusFeed(roomId: string): Promise<void> {
  const client = getLiveblocksClient()
  const existingFeeds = await client.getFeeds({ roomId })

  if (existingFeeds.data.some((feed) => feed.feedId === AI_STATUS_FEED)) {
    return
  }

  try {
    await client.createFeed({
      roomId,
      feedId: AI_STATUS_FEED,
      metadata: { kind: "status" },
    })
  } catch (error) {
    const refreshedFeeds = await client.getFeeds({ roomId })
    if (!refreshedFeeds.data.some((feed) => feed.feedId === AI_STATUS_FEED)) {
      throw error
    }
  }
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
  extra?: { text?: string; feed?: typeof AI_STATUS_FEED },
): Promise<void> {
  const client = getLiveblocksClient()
  const event: AiStatusEvent = {
    type: "AI_STATUS",
    feed: extra?.feed ?? AI_STATUS_FEED,
    phase,
    message,
    text: extra?.text ?? message,
  }

  await ensureAiStatusFeed(roomId)
  await client.createFeedMessage({
    roomId,
    feedId: AI_STATUS_FEED,
    data: {
      type: event.type,
      feed: event.feed,
      phase: event.phase,
      message: event.message,
      text: event.text,
      timestamp: Date.now(),
    },
  })
  await client.broadcastEvent(roomId, event)
}
