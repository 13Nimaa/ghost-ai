import {
  getCurrentClerkIdentity,
  resolveProjectAccess,
} from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { getSpecFilename } from "@/lib/specs"

interface DownloadRouteParams {
  projectId: string
  specId: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<DownloadRouteParams> },
) {
  const { projectId, specId } = await params

  if (!projectId || !specId) {
    return Response.json({ error: "Missing project or spec ID" }, { status: 400 })
  }

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

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { projectId: true, filePath: true },
  })

  if (!spec || spec.projectId !== projectId) {
    return Response.json({ error: "Spec not found" }, { status: 404 })
  }

  let fileResponse: Response

  try {
    fileResponse = await fetch(spec.filePath, { cache: "no-store" })
  } catch {
    return Response.json({ error: "Spec unavailable" }, { status: 502 })
  }

  if (!fileResponse.ok) {
    return Response.json({ error: "Spec unavailable" }, { status: 502 })
  }

  return new Response(fileResponse.body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${getSpecFilename(projectId, specId)}"`,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}
