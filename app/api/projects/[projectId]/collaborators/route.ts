import { getCurrentClerkIdentity, resolveProjectAccess } from "@/lib/project-access";
import {
  getProjectOwner,
  inviteProjectCollaborator,
  listProjectCollaborators,
} from "@/lib/collaborators";

interface CollaboratorRouteParams {
  projectId: string;
}

interface InviteCollaboratorBody {
  email?: unknown;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<CollaboratorRouteParams> },
) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  if (!projectId) {
    return Response.json({ error: "Missing project ID" }, { status: 400 });
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

  const [collaborators, owner] = await Promise.all([
    listProjectCollaborators(projectId),
    getProjectOwner(access.ownerId),
  ]);

  return Response.json({ collaborators, owner, isOwner: access.isOwner });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<CollaboratorRouteParams> },
) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  if (!projectId) {
    return Response.json({ error: "Missing project ID" }, { status: 400 });
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

  if (!access.isOwner) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: InviteCollaboratorBody;
  try {
    body = (await request.json()) as InviteCollaboratorBody;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.email !== "string") {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  const result = await inviteProjectCollaborator(projectId, body.email);

  if (result.status === "invalid_email") {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  return Response.json({ collaborator: result.collaborator }, { status: 201 });
}
