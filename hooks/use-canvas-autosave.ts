"use client"

import { useEffect, useRef, useState } from "react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error"

interface UseCanvasAutosaveOptions {
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  enabled: boolean
  debounceMs?: number
}

interface UseCanvasAutosaveResult {
  status: CanvasSaveStatus
}

const DEFAULT_DEBOUNCE_MS = 1500

function serializeCanvas(nodes: CanvasNode[], edges: CanvasEdge[]): string {
  return JSON.stringify({ nodes, edges })
}

/**
 * Debounced canvas autosave. Saves stay serialized so an older request can
 * never land after a newer one from the same editor, and the initial snapshot
 * after hydration is treated as the baseline instead of being uploaded.
 */
export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveResult {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle")
  const baselineRef = useRef<string | null>(null)
  const latestRef = useRef<string | null>(null)
  const queuedRef = useRef<string | null>(null)
  const inFlightRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const projectIdRef = useRef(projectId)
  const saveRef = useRef<(snapshot: string) => void>(() => {})

  useEffect(() => {
    projectIdRef.current = projectId
  }, [projectId])

  useEffect(() => {
    mountedRef.current = true

    async function runSave(snapshot: string) {
      if (snapshot === baselineRef.current) {
        return
      }

      if (inFlightRef.current) {
        queuedRef.current = snapshot
        return
      }

      inFlightRef.current = true
      const controller = new AbortController()
      abortRef.current = controller
      setStatus("saving")
      let saved = false

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectIdRef.current)}/canvas`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: snapshot,
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error("Canvas save failed")
        }

        baselineRef.current = snapshot
        saved = true

        if (mountedRef.current) {
          setStatus("saved")
        }
      } catch {
        if (!controller.signal.aborted && mountedRef.current) {
          setStatus("error")
        }
      } finally {
        inFlightRef.current = false

        if (abortRef.current === controller) {
          abortRef.current = null
        }

        const queued = queuedRef.current
        queuedRef.current = null

        if (mountedRef.current) {
          const latest = latestRef.current
          const next =
            saved && latest && latest !== snapshot ? latest : queued

          if (next && next !== snapshot) {
            void runSave(next)
          }
        }
      }
    }

    saveRef.current = (snapshot) => {
      void runSave(snapshot)
    }

    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!enabled) {
      baselineRef.current = null
      latestRef.current = null
      queuedRef.current = null
      return
    }

    const snapshot = serializeCanvas(nodes, edges)

    latestRef.current = snapshot

    if (baselineRef.current === null) {
      baselineRef.current = snapshot
      return
    }

    if (snapshot === baselineRef.current || snapshot === queuedRef.current) {
      return
    }

    const timeout = window.setTimeout(() => {
      saveRef.current(snapshot)
    }, debounceMs)

    return () => window.clearTimeout(timeout)
  }, [debounceMs, edges, enabled, nodes])

  return { status }
}
