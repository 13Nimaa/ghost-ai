"use client"

import { useCallback, useMemo, useState } from "react"

export interface MockProject {
  id: string
  name: string
  slug: string
}

export type ProjectDialogType = "create" | "rename" | "delete"

export const ownedMockProjects: MockProject[] = [
  { id: "mock-1", name: "Marketing Site", slug: "marketing-site" },
  { id: "mock-2", name: "Design System", slug: "design-system" },
]

export const sharedMockProjects: MockProject[] = [
  { id: "mock-3", name: "Platform API", slug: "platform-api" },
]

export function slugifyProjectName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export interface ProjectDialogsController {
  activeDialog: ProjectDialogType | null
  selectedProject: MockProject | null
  name: string
  slugPreview: string
  isSubmitting: boolean
  openCreate: () => void
  openRename: (project: MockProject) => void
  openDelete: (project: MockProject) => void
  closeDialog: () => void
  setName: (value: string) => void
  submitCreate: () => void
  submitRename: () => void
  submitDelete: () => void
}

export function useProjectDialogs(): ProjectDialogsController {
  const [activeDialog, setActiveDialog] =
    useState<ProjectDialogType | null>(null)
  const [selectedProject, setSelectedProject] = useState<MockProject | null>(
    null
  )
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const slugPreview = useMemo(() => slugifyProjectName(name), [name])

  const closeDialog = useCallback(() => {
    setActiveDialog(null)
    setSelectedProject(null)
    setName("")
    setIsSubmitting(false)
  }, [])

  const openCreate = useCallback(() => {
    setSelectedProject(null)
    setName("")
    setIsSubmitting(false)
    setActiveDialog("create")
  }, [])

  const openRename = useCallback((project: MockProject) => {
    setSelectedProject(project)
    setName(project.name)
    setIsSubmitting(false)
    setActiveDialog("rename")
  }, [])

  const openDelete = useCallback((project: MockProject) => {
    setSelectedProject(project)
    setName(project.name)
    setIsSubmitting(false)
    setActiveDialog("delete")
  }, [])

  const submitCreate = useCallback(() => {
    if (name.trim().length === 0) return
    setIsSubmitting(true)
    closeDialog()
  }, [name, closeDialog])

  const submitRename = useCallback(() => {
    if (name.trim().length === 0) return
    setIsSubmitting(true)
    closeDialog()
  }, [name, closeDialog])

  const submitDelete = useCallback(() => {
    setIsSubmitting(true)
    closeDialog()
  }, [closeDialog])

  return {
    activeDialog,
    selectedProject,
    name,
    slugPreview,
    isSubmitting,
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
