"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type { ProjectListItem } from "@/lib/projects"

export type ProjectDialogType = "create" | "rename" | "delete"

export function slugifyProjectName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function createRoomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

interface CreatedProjectResponse {
  project?: {
    id?: unknown
  }
}

interface UseProjectActionsOptions {
  activeProjectId?: string
}

export interface ProjectActionsController {
  activeDialog: ProjectDialogType | null
  selectedProject: ProjectListItem | null
  name: string
  roomIdPreview: string
  isSubmitting: boolean
  error: string | null
  openCreate: () => void
  openRename: (project: ProjectListItem) => void
  openDelete: (project: ProjectListItem) => void
  closeDialog: () => void
  setName: (value: string) => void
  submitCreate: () => void
  submitRename: () => void
  submitDelete: () => void
}

export function useProjectActions(
  options: UseProjectActionsOptions = {}
): ProjectActionsController {
  const router = useRouter()
  const { activeProjectId } = options
  const [activeDialog, setActiveDialog] =
    useState<ProjectDialogType | null>(null)
  const [selectedProject, setSelectedProject] =
    useState<ProjectListItem | null>(null)
  const [name, setName] = useState("")
  const [roomSuffix, setRoomSuffix] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roomIdPreview = useMemo(() => {
    const slug = slugifyProjectName(name)
    if (slug.length === 0) return roomSuffix
    if (roomSuffix.length === 0) return slug
    return `${slug}-${roomSuffix}`
  }, [name, roomSuffix])

  const closeDialog = useCallback(() => {
    setActiveDialog(null)
    setSelectedProject(null)
    setName("")
    setRoomSuffix("")
    setIsSubmitting(false)
    setError(null)
  }, [])

  const openCreate = useCallback(() => {
    setSelectedProject(null)
    setName("")
    setRoomSuffix(createRoomSuffix())
    setIsSubmitting(false)
    setError(null)
    setActiveDialog("create")
  }, [])

  const openRename = useCallback((project: ProjectListItem) => {
    setSelectedProject(project)
    setName(project.name)
    setRoomSuffix("")
    setIsSubmitting(false)
    setError(null)
    setActiveDialog("rename")
  }, [])

  const openDelete = useCallback((project: ProjectListItem) => {
    setSelectedProject(project)
    setName(project.name)
    setRoomSuffix("")
    setIsSubmitting(false)
    setError(null)
    setActiveDialog("delete")
  }, [])

  const submitCreate = useCallback(() => {
    const trimmed = name.trim()
    if (trimmed.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    setError(null)

    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to create project")
        }
        const data = (await response.json()) as CreatedProjectResponse
        const projectId = data.project?.id
        if (typeof projectId !== "string" || projectId.length === 0) {
          throw new Error("Failed to create project")
        }
        return projectId
      })
      .then((projectId) => {
        closeDialog()
        // The workspace URL and the future Liveblocks room both use the
        // database project ID, keeping them aligned.
        router.push(`/editor/${projectId}`)
      })
      .catch(() => {
        setError("Could not create the project. Please try again.")
        setIsSubmitting(false)
      })
  }, [name, isSubmitting, closeDialog, router])

  const submitRename = useCallback(() => {
    const trimmed = name.trim()
    if (trimmed.length === 0 || isSubmitting || !selectedProject) return
    setIsSubmitting(true)
    setError(null)

    fetch(`/api/projects/${selectedProject.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to rename project")
        }
        closeDialog()
        router.refresh()
      })
      .catch(() => {
        setError("Could not rename the project. Please try again.")
        setIsSubmitting(false)
      })
  }, [name, isSubmitting, selectedProject, closeDialog, router])

  const submitDelete = useCallback(() => {
    if (isSubmitting || !selectedProject) return
    const targetId = selectedProject.id
    setIsSubmitting(true)
    setError(null)

    fetch(`/api/projects/${targetId}`, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete project")
        }
        closeDialog()
        if (activeProjectId && targetId === activeProjectId) {
          router.push("/editor")
        } else {
          router.refresh()
        }
      })
      .catch(() => {
        setError("Could not delete the project. Please try again.")
        setIsSubmitting(false)
      })
  }, [isSubmitting, selectedProject, activeProjectId, closeDialog, router])

  return {
    activeDialog,
    selectedProject,
    name,
    roomIdPreview,
    isSubmitting,
    error,
    openCreate,
    openRename,
    openDelete,
    closeDialog,
    setName,
    submitCreate,
    submitRename,
    submitDelete,
  }
}
