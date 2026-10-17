import { auth, currentUser } from "@clerk/nextjs/server"

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
