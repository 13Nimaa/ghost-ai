import { clerkClient } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"

export interface Collaborator {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
}

export type InviteCollaboratorResult =
  | { status: "ok"; collaborator: Collaborator }
  | { status: "invalid_email" }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface CollaboratorRow {
  id: string
  email: string
}

interface ClerkProfile {
  name: string | null
  imageUrl: string | null
}

async function loadClerkProfiles(
  emails: string[],
): Promise<Map<string, ClerkProfile>> {
  const profiles = new Map<string, ClerkProfile>()

  if (emails.length === 0) {
    return profiles
  }

  try {
    const client = await clerkClient()
    const { data } = await client.users.getUserList({
      emailAddress: emails.slice(0, 100),
      limit: 100,
    })

    for (const user of data) {
      const profile: ClerkProfile = {
        name: user.fullName ?? user.username ?? null,
        imageUrl: user.hasImage ? user.imageUrl : null,
      }

      for (const address of user.emailAddresses) {
        profiles.set(address.emailAddress.toLowerCase(), profile)
      }
    }
  } catch {
    // Enrichment is best-effort; fall back to email-only collaborators.
  }

  return profiles
}

async function enrichCollaborators(
  rows: CollaboratorRow[],
): Promise<Collaborator[]> {
  if (rows.length === 0) {
    return []
  }

  const profiles = await loadClerkProfiles(rows.map((row) => row.email))

  return rows.map((row) => {
    const profile = profiles.get(row.email.toLowerCase())
    return {
      id: row.id,
      email: row.email,
      name: profile?.name ?? null,
      imageUrl: profile?.imageUrl ?? null,
    }
  })
}

export async function listProjectCollaborators(
  projectId: string,
): Promise<Collaborator[]> {
  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  })

  return enrichCollaborators(rows)
}

export async function inviteProjectCollaborator(
  projectId: string,
  email: string,
): Promise<InviteCollaboratorResult> {
  const trimmed = email.trim()

  if (!EMAIL_PATTERN.test(trimmed)) {
    return { status: "invalid_email" }
  }

  const row = await prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email: trimmed } },
    create: { projectId, email: trimmed },
    update: {},
    select: { id: true, email: true },
  })

  const [collaborator] = await enrichCollaborators([row])
  return { status: "ok", collaborator }
}

export async function removeProjectCollaborator(
  projectId: string,
  collaboratorId: string,
): Promise<boolean> {
  const result = await prisma.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  })

  return result.count > 0
}

export async function getProjectOwner(ownerId: string): Promise<Collaborator> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(ownerId)
    const email =
      user.emailAddresses.find(
        (address) => address.id === user.primaryEmailAddressId,
      )?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      ""

    return {
      id: user.id,
      email,
      name: user.fullName ?? user.username ?? null,
      imageUrl: user.hasImage ? user.imageUrl : null,
    }
  } catch {
    return { id: ownerId, email: "", name: null, imageUrl: null }
  }
}
