"use client"

import { useCallback, useEffect, useState } from "react"

import {
  getSpecDownloadPath,
  type ProjectSpecListItem,
} from "@/lib/specs"

interface SpecsListResponse {
  specs?: unknown
}

function isSpecListItem(value: unknown): value is ProjectSpecListItem {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const item = value as Record<string, unknown>
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.createdAt === "string" &&
    typeof item.filename === "string" &&
    item.filename.length > 0
  )
}

function parseSpecs(value: unknown): ProjectSpecListItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isSpecListItem)
}

async function fetchSpecs(projectId: string): Promise<ProjectSpecListItem[]> {
  const response = await fetch(`/api/projects/${projectId}/specs`)
  if (!response.ok) {
    throw new Error("Failed to load specs")
  }
  const data = (await response.json()) as SpecsListResponse
  return parseSpecs(data.specs)
}

export interface ProjectSpecsController {
  specs: ProjectSpecListItem[]
  isLoading: boolean
  error: string | null
  selectedSpec: ProjectSpecListItem | null
  previewContent: string | null
  isPreviewLoading: boolean
  previewError: string | null
  openPreview: (spec: ProjectSpecListItem) => void
  closePreview: () => void
  downloadSpec: (spec: ProjectSpecListItem) => void
  refresh: () => void
}

export function useProjectSpecs(projectId: string): ProjectSpecsController {
  const [specs, setSpecs] = useState<ProjectSpecListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSpec, setSelectedSpec] = useState<ProjectSpecListItem | null>(
    null,
  )
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchSpecs(projectId)
      .then((nextSpecs) => {
        if (cancelled) return
        setSpecs(nextSpecs)
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setError("Could not load specs. Please try again.")
        setSpecs([])
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [projectId, reloadKey])

  const refresh = useCallback(() => {
    setIsLoading(true)
    setError(null)
    setReloadKey((value) => value + 1)
  }, [])

  const closePreview = useCallback(() => {
    setSelectedSpec(null)
    setPreviewContent(null)
    setPreviewError(null)
    setIsPreviewLoading(false)
  }, [])

  const openPreview = useCallback(
    (spec: ProjectSpecListItem) => {
      setSelectedSpec(spec)
      setPreviewContent(null)
      setPreviewError(null)
      setIsPreviewLoading(true)

      fetch(getSpecDownloadPath(projectId, spec.id))
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to load spec")
          }
          return response.text()
        })
        .then((content) => {
          setPreviewContent(content)
        })
        .catch(() => {
          setPreviewError("Could not load this spec. Please try again.")
          setPreviewContent(null)
        })
        .finally(() => {
          setIsPreviewLoading(false)
        })
    },
    [projectId],
  )

  const downloadSpec = useCallback(
    (spec: ProjectSpecListItem) => {
      const link = document.createElement("a")
      link.href = getSpecDownloadPath(projectId, spec.id)
      link.download = spec.filename
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    [projectId],
  )

  return {
    specs,
    isLoading,
    error,
    selectedSpec,
    previewContent,
    isPreviewLoading,
    previewError,
    openPreview,
    closePreview,
    downloadSpec,
    refresh,
  }
}
