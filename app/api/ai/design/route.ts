import { auth } from "@clerk/nextjs/server";
import { tasks } from "@trigger.dev/sdk";

import {
  getCurrentClerkIdentity,
  resolveProjectAccess,
} from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { designAgentTask } from "@/src/trigger/design-agent";

interface DesignRequestBody {
  prompt?: unknown;
  roomId?: unknown;
  projectId?: unknown;
}

function parseRequiredString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: DesignRequestBody;

  try {
    body = (await request.json()) as DesignRequestBody;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const prompt = parseRequiredString(body.prompt);
  const roomId = parseRequiredString(body.roomId);
  const projectId = parseRequiredString(body.projectId);

  if (!prompt) {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  if (!roomId) {
    return Response.json({ error: "Missing room ID" }, { status: 400 });
  }

  if (!projectId) {
    return Response.json({ error: "Missing project ID" }, { status: 400 });
  }

  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await resolveProjectAccess(
    projectId,
    identity.userId,
    identity.email,
  );

  if (access.status === "not_found") {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (access.status === "forbidden") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let handle: Awaited<ReturnType<typeof tasks.trigger<typeof designAgentTask>>>;

  try {
    handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt,
      roomId,
    });
  } catch {
    return Response.json({ error: "Failed to start design task" }, { status: 500 });
  }

  try {
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
        userId,
      },
    });
  } catch {
    return Response.json(
      { error: "Failed to record task run" },
      { status: 500 },
    );
  }

  return Response.json({ runId: handle.id }, { status: 201 });
}
