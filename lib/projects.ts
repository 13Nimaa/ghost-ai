import { prisma } from "@/lib/prisma";

export interface ProjectListItem {
  id: string;
  name: string;
}

export interface AccessibleProject {
  id: string;
  name: string;
  ownerId: string;
}

export async function getOwnedProjects(
  ownerId: string,
): Promise<ProjectListItem[]> {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true },
  });
}

export async function getSharedProjects(
  email: string,
): Promise<ProjectListItem[]> {
  if (email.length === 0) {
    return [];
  }

  const rows = await prisma.projectCollaborator.findMany({
    where: { email },
    orderBy: { createdAt: "desc" },
    select: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return rows.map((row) => row.project);
}

export async function getAccessibleProject(
  projectId: string,
  userId: string,
  email: string,
): Promise<AccessibleProject | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, ownerId: true },
  });

  if (!project) {
    return null;
  }

  if (project.ownerId === userId) {
    return project;
  }

  if (email.length === 0) {
    return null;
  }

  const membership = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: { projectId, email },
    },
    select: { id: true },
  });

  return membership ? project : null;
}
