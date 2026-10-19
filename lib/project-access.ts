import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { getAccessibleProject, type AccessibleProject } from "@/lib/projects"

export interface ClerkIdentity {
  userId: string | null
  email: string
}

export async function getCurrentClerkIdentity(): Promise<ClerkIdentity> {
  const { userId } = await auth()

  if (!userId) {
    return { userId: null, email: "" }
  }

  const user = await currentUser()
  const email =
    user?.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    )?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    ""

  return { userId, email }
}

export async function checkProjectAccess(
  projectId: string,
  userId: string,
  email: string,
): Promise<AccessibleProject | null> {
  return getAccessibleProject(projectId, userId, email)
}

export type ProjectAccess =
  | { status: "ok"; isOwner: boolean; ownerId: string }
  | { status: "not_found" }
  | { status: "forbidden" }

export async function resolveProjectAccess(
  projectId: string,
  userId: string,
  email: string,
): Promise<ProjectAccess> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })

  if (!project) {
    return { status: "not_found" }
  }

  if (project.ownerId === userId) {
    return { status: "ok", isOwner: true, ownerId: project.ownerId }
  }

  if (email.length === 0) {
    return { status: "forbidden" }
  }

  const membership = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
    select: { id: true },
  })

  return membership
    ? { status: "ok", isOwner: false, ownerId: project.ownerId }
    : { status: "forbidden" }
}
