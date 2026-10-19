import { getCurrentClerkIdentity, resolveProjectAccess } from "@/lib/project-access";
import { removeProjectCollaborator } from "@/lib/collaborators";

interface CollaboratorRouteParams {
  projectId: string;
  collaboratorId: string;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<CollaboratorRouteParams> },
) {
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, collaboratorId } = await params;

  if (!projectId || !collaboratorId) {
    return Response.json({ error: "Missing route parameters" }, { status: 400 });
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

  const removed = await removeProjectCollaborator(projectId, collaboratorId);

  if (!removed) {
    return Response.json(
      { error: "Collaborator not found" },
      { status: 404 },
    );
  }

  return Response.json({ success: true });
}
