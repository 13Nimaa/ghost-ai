"use client"

import { useCallback, useState } from "react"

import type { Collaborator } from "@/lib/collaborators"

interface CollaboratorsResponse {
  collaborators?: unknown
  owner?: unknown
  isOwner?: unknown
}

interface CollaboratorResponse {
  collaborator?: unknown
}

interface UseShareDialogOptions {
  projectId: string
  initialIsOwner: boolean
}

export interface ShareDialogController {
  isOpen: boolean
  projectLink: string
  owner: Collaborator | null
  collaborators: Collaborator[]
  isOwner: boolean
  isLoading: boolean
  email: string
  isSubmitting: boolean
  error: string | null
  copied: boolean
  open: () => void
  close: () => void
  setEmail: (value: string) => void
  invite: () => void
  remove: (collaboratorId: string) => void
  copyLink: () => void
}

function parseCollaborator(value: unknown): Collaborator | null {
  if (typeof value !== "object" || value === null) return null
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.email !== "string"
  ) {
    return null
  }

  return {
    id: candidate.id,
    email: candidate.email,
    name: typeof candidate.name === "string" ? candidate.name : null,
    imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : null,
  }
}

function parseCollaborators(value: unknown): Collaborator[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => parseCollaborator(item))
    .filter((item): item is Collaborator => item !== null)
}

export function useShareDialog({
  projectId,
  initialIsOwner,
}: UseShareDialogOptions): ShareDialogController {
  const [isOpen, setIsOpen] = useState(false)
  const [owner, setOwner] = useState<Collaborator | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isOwner, setIsOwner] = useState(initialIsOwner)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const projectLink =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/editor/${projectId}`

  const loadCollaborators = useCallback(() => {
    setIsLoading(true)
    setError(null)

    fetch(`/api/projects/${projectId}/collaborators`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load collaborators")
        }
        return (await response.json()) as CollaboratorsResponse
      })
      .then((data) => {
        setCollaborators(parseCollaborators(data.collaborators))
        setOwner(parseCollaborator(data.owner))
        if (typeof data.isOwner === "boolean") {
          setIsOwner(data.isOwner)
        }
      })
      .catch(() => {
        setError("Could not load collaborators. Please try again.")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [projectId])

  const open = useCallback(() => {
    setEmail("")
    setError(null)
    setCopied(false)
    setIsOpen(true)
    loadCollaborators()
  }, [loadCollaborators])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const invite = useCallback(() => {
    const trimmed = email.trim()
    if (trimmed.length === 0 || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    fetch(`/api/projects/${projectId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    })
      .then(async (response) => {
        if (response.status === 400) {
          throw new Error("Enter a valid email address.")
        }
        if (!response.ok) {
          throw new Error("Could not invite the collaborator. Please try again.")
        }
        return (await response.json()) as CollaboratorResponse
      })
      .then((data) => {
        const invited = parseCollaborators([data.collaborator])[0]
        if (invited) {
          setCollaborators((current) => {
            const withoutDuplicate = current.filter(
              (item) => item.id !== invited.id,
            )
            return [...withoutDuplicate, invited]
          })
        }
        setEmail("")
        setIsSubmitting(false)
      })
      .catch((inviteError: Error) => {
        setError(inviteError.message)
        setIsSubmitting(false)
      })
  }, [email, isSubmitting, projectId])

  const remove = useCallback(
    (collaboratorId: string) => {
      if (isSubmitting) return

      setIsSubmitting(true)
      setError(null)

      fetch(`/api/projects/${projectId}/collaborators/${collaboratorId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Could not remove the collaborator. Please try again.",
            )
          }
          setCollaborators((current) =>
            current.filter((item) => item.id !== collaboratorId),
          )
          setIsSubmitting(false)
        })
        .catch((removeError: Error) => {
          setError(removeError.message)
          setIsSubmitting(false)
        })
    },
    [isSubmitting, projectId],
  )

  const copyLink = useCallback(() => {
    if (projectLink.length === 0) return

    navigator.clipboard
      .writeText(projectLink)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        setError("Could not copy the project link.")
      })
  }, [projectLink])

  return {
    isOpen,
    projectLink,
    owner,
    collaborators,
    isOwner,
    isLoading,
    email,
    isSubmitting,
    error,
    copied,
    open,
    close,
    setEmail,
    invite,
    remove,
    copyLink,
  }
}
