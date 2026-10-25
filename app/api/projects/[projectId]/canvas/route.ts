import { auth } from "@clerk/nextjs/server"
import type { Prisma } from "@/lib/generated/prisma/client"

import { prisma } from "@/lib/prisma"
import { getCurrentClerkIdentity } from "@/lib/project-access"
import {
  MAX_CANVAS_BYTES,
  parseCanvasSnapshot,
} from "@/lib/canvas-snapshot"

interface CanvasRouteParams {
  projectId: string
}

const NO_STORE_HEADERS = { "Cache-Control": "no-store" }

async function readLimitedBody(
  request: Request,
  maxBytes: number,
): Promise<string | null> {
  const contentLength = Number(request.headers.get("content-length") ?? "")

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return null
  }

  if (!request.body) {
    return ""
  }

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let totalBytes = 0
  let text = ""

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      totalBytes += value.byteLength

      if (totalBytes > maxBytes) {
        await reader.cancel()
        return null
      }

      text += decoder.decode(value, { stream: true })
    }

    return text + decoder.decode()
  } finally {
    reader.releaseLock()
  }
}

async function authorizeCanvasRequest(projectId: string) {
  const { userId } = await auth()

  if (!userId) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true, canvasJson: true },
  })

  if (!project) {
    return { error: Response.json({ error: "Project not found" }, { status: 404 }) }
  }

  if (project.ownerId === userId) {
    return { project }
  }

  const identity = await getCurrentClerkIdentity()

  if (!identity.userId || identity.email.length === 0) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) }
  }

  const membership = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: { projectId, email: identity.email },
    },
    select: { id: true },
  })

  if (!membership) {
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { project }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<CanvasRouteParams> },
) {
  const { projectId } = await params

  if (!projectId) {
    return Response.json({ error: "Missing project ID" }, { status: 400 })
  }

  const authorization = await authorizeCanvasRequest(projectId)

  if ("error" in authorization) {
    return authorization.error
  }

  const rawBody = await readLimitedBody(request, MAX_CANVAS_BYTES)

  if (rawBody === null) {
    return Response.json({ error: "Canvas is too large" }, { status: 413 })
  }

  let parsedBody: unknown

  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: "Invalid canvas payload" }, { status: 400 })
  }

  const snapshot = parseCanvasSnapshot(parsedBody)

  if (!snapshot) {
    return Response.json({ error: "Invalid canvas payload" }, { status: 400 })
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        canvasJson: snapshot as unknown as Prisma.InputJsonValue,
      },
    })
  } catch {
    return Response.json({ error: "Failed to save canvas" }, { status: 500 })
  }

  return Response.json({ saved: true }, { headers: NO_STORE_HEADERS })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<CanvasRouteParams> },
) {
  const { projectId } = await params

  if (!projectId) {
    return Response.json({ error: "Missing project ID" }, { status: 400 })
  }

  const authorization = await authorizeCanvasRequest(projectId)

  if ("error" in authorization) {
    return authorization.error
  }

  const stored = authorization.project.canvasJson

  if (stored == null) {
    return Response.json({ canvas: null }, { headers: NO_STORE_HEADERS })
  }

  const snapshot = parseCanvasSnapshot(stored)

  if (!snapshot) {
    return Response.json(
      { error: "Canvas unavailable" },
      { status: 502, headers: NO_STORE_HEADERS },
    )
  }

  return Response.json({ canvas: snapshot }, { headers: NO_STORE_HEADERS })
}
