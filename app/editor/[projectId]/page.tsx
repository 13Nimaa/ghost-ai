import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";
import { EditorWorkspace } from "@/components/editor/editor-workspace";
import {
  getAccessibleProject,
  getOwnedProjects,
  getSharedProjects,
} from "@/lib/projects";

export const instant = false;

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in");
  }

  const user = await currentUser();
  const email =
    user?.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    )?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "";

  const project = await getAccessibleProject(projectId, userId, email);

  if (!project) {
    redirect("/editor");
  }

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(email),
  ]);

  return (
    <EditorShell
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
      activeProjectId={project.id}
    >
      <EditorWorkspace projectName={project.name} />
    </EditorShell>
  );
}
