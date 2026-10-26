import {
  getCurrentClerkIdentity,
  resolveProjectAccess,
} from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { getSpecFilename } from "@/lib/specs"

interface SpecsRouteParams {
  projectId: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<SpecsRouteParams> },
) {
  const { projectId } = await params

  if (!projectId) {
    return Response.json({ error: "Missing project ID" }, { status: 400 })
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

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  })

  return Response.json({
    specs: specs.map((spec) => ({
      id: spec.id,
      createdAt: spec.createdAt.toISOString(),
      filename: getSpecFilename(projectId, spec.id),
    })),
  })
}
