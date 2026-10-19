import { Liveblocks } from "@liveblocks/node"

const CURSOR_COLORS = [
  "#E5484D",
  "#E57A00",
  "#2B9A66",
  "#0091FF",
  "#6E56CF",
  "#AB4ABA",
  "#D6409F",
] as const

const globalForLiveblocks = globalThis as typeof globalThis & {
  liveblocksClient?: Liveblocks
}

export function getLiveblocksClient(): Liveblocks {
  if (globalForLiveblocks.liveblocksClient) {
    return globalForLiveblocks.liveblocksClient
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY

  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not configured")
  }

  const client = new Liveblocks({ secret })
  globalForLiveblocks.liveblocksClient = client

  return client
}

export function getCursorColor(userId: string): string {
  let hash = 2166136261

  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return CURSOR_COLORS[(hash >>> 0) % CURSOR_COLORS.length]
}
