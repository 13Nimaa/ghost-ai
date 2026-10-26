import { auth } from "@clerk/nextjs/server"
import { tasks } from "@trigger.dev/sdk"

import {
  getCurrentClerkIdentity,
  resolveProjectAccess,
} from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import {
  generateSpecRequestSchema,
  type generateSpecTask,
} from "@/src/trigger/generate-spec"

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let rawBody: unknown

  try {
    rawBody = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = generateSpecRequestSchema.safeParse(rawBody)

  if (!parsed.success) {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data
  // Liveblocks room IDs are aligned with project IDs — never trust a client projectId.
  const projectId = roomId

  const identity = await getCurrentClerkIdentity()

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const access = await resolveProjectAccess(
    projectId,
    identity.userId,
    identity.email,
  )

  if (access.status === "not_found") {
    return Response.json({ error: "Project not found" }, { status: 404 })
  }

  if (access.status === "forbidden") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  let handle: Awaited<ReturnType<typeof tasks.trigger<typeof generateSpecTask>>>

  try {
    handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
      projectId,
      roomId,
      chatHistory,
      nodes,
      edges,
    })
  } catch {
    return Response.json(
      { error: "Failed to start spec task" },
      { status: 500 },
    )
  }

  try {
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId,
      },
    })
  } catch {
    return Response.json(
      { error: "Failed to record task run" },
      { status: 500 },
    )
  }

  return Response.json({ runId: handle.id }, { status: 201 })
}
