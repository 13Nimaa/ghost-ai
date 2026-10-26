import { checkProjectAccess, getCurrentClerkIdentity } from "@/lib/project-access"
import { ensureAiChatFeed } from "@/lib/ai-chat"
import { ensureAiStatusFeed } from "@/lib/ai-room"
import { getCursorColor, getLiveblocksClient } from "@/lib/liveblocks"

interface LiveblocksAuthBody {
  room?: unknown
}

export async function POST(request: Request) {
  const identity = await getCurrentClerkIdentity()

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let requestBody: LiveblocksAuthBody

  try {
    requestBody = (await request.json()) as LiveblocksAuthBody
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (typeof requestBody.room !== "string" || requestBody.room.length === 0) {
    return Response.json({ error: "Missing project ID" }, { status: 400 })
  }

  const projectId = requestBody.room
  const project = await checkProjectAccess(
    projectId,
    identity.userId,
    identity.email,
  )

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const liveblocks = getLiveblocksClient()

  await liveblocks.getOrCreateRoom(projectId, {
    defaultAccesses: [],
  })
  await ensureAiChatFeed(projectId)
  await ensureAiStatusFeed(projectId)

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name: identity.name,
      avatar: identity.avatar,
      color: getCursorColor(identity.userId),
    },
  })

  session.allow(projectId, ["*:write"])

  const { body, status } = await session.authorize()

  return new Response(body, { status })
}
