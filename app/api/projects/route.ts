import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface CreateProjectBody {
  name?: unknown;
  description?: unknown;
}

function parseName(value: unknown): string {
  if (typeof value !== "string") {
    return "Untitled Project";
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Untitled Project";
}

function parseDescription(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ projects });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateProjectBody;
  try {
    body = (await request.json()) as CreateProjectBody;
  } catch {
    body = {};
  }

  if (
    body.name !== undefined &&
    typeof body.name !== "string"
  ) {
    return Response.json({ error: "Invalid project name" }, { status: 400 });
  }

  if (
    body.description !== undefined &&
    typeof body.description !== "string"
  ) {
    return Response.json(
      { error: "Invalid project description" },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      ownerId: userId,
      name: parseName(body.name),
      description: parseDescription(body.description),
    },
  });

  return Response.json({ project }, { status: 201 });
}
