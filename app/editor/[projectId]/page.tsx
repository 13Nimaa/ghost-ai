import { redirect } from "next/navigation"

import { AccessDenied } from "@/components/editor/access-denied"
import { EditorWorkspace } from "@/components/editor/editor-workspace"
import {
  checkProjectAccess,
  getCurrentClerkIdentity,
} from "@/lib/project-access"
import { getOwnedProjects, getSharedProjects } from "@/lib/projects"

export const instant = false;

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const identity = await getCurrentClerkIdentity();

  if (!identity.userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in");
  }

  const project = await checkProjectAccess(
    projectId,
    identity.userId,
    identity.email
  );

  if (!project) {
    return <AccessDenied />;
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(identity.userId),
    getSharedProjects(identity.email),
  ]);

  return (
    <EditorWorkspace
      projectName={project.name}
      activeProjectId={project.id}
      isOwner={project.ownerId === identity.userId}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  );
}
