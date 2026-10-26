import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"

import { prisma } from "@/lib/prisma"

interface SpecTokenBody {
  runId?: unknown
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: SpecTokenBody

  try {
    body = (await request.json()) as SpecTokenBody
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (typeof body.runId !== "string" || body.runId.trim().length === 0) {
    return Response.json({ error: "Missing run ID" }, { status: 400 })
  }

  const runId = body.runId.trim()

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
    select: { userId: true },
  })

  if (!taskRun) {
    return Response.json({ error: "Run not found" }, { status: 404 })
  }

  if (taskRun.userId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const token = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
      expirationTime: "1h",
    })

    return Response.json({ token })
  } catch {
    return Response.json(
      { error: "Failed to create access token" },
      { status: 500 },
    )
  }
}
