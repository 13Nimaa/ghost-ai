import { AI_CHAT_FEED } from "@/types/tasks"

import { getLiveblocksClient } from "@/lib/liveblocks"

export { AI_CHAT_FEED }

export async function ensureAiChatFeed(roomId: string): Promise<void> {
  const client = getLiveblocksClient()
  const existingFeeds = await client.getFeeds({ roomId })

  if (existingFeeds.data.some((feed) => feed.feedId === AI_CHAT_FEED)) {
    return
  }

  try {
    await client.createFeed({
      roomId,
      feedId: AI_CHAT_FEED,
      metadata: { kind: "chat" },
    })
  } catch (error) {
    // Two collaborators can authenticate at the same time. Reuse the feed if
    // the other request won the create race, but surface unrelated failures.
    const refreshedFeeds = await client.getFeeds({ roomId })
    if (!refreshedFeeds.data.some((feed) => feed.feedId === AI_CHAT_FEED)) {
      throw error
    }
  }
}
