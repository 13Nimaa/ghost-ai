import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface RenameProjectBody {
  name?: unknown;
}

interface ProjectRouteParams {
  projectId: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<ProjectRouteParams> },
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  if (!projectId) {
    return Response.json({ error: "Missing project ID" }, { status: 400 });
  }

  let body: RenameProjectBody;
  try {
    body = (await request.json()) as RenameProjectBody;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return Response.json({ error: "Invalid project name" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!existing) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (existing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name: body.name.trim() },
  });

  return Response.json({ project });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<ProjectRouteParams> },
) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  if (!projectId) {
    return Response.json({ error: "Missing project ID" }, { status: 400 });
  }

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!existing) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (existing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return Response.json({ success: true });
}
