"use client"

import { useEffect } from "react"
import type { ReactFlowInstance } from "@xyflow/react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const VIEWPORT_ANIMATION_DURATION = 200

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.matches("input, textarea") ||
    target.isContentEditable
  )
}

export function useKeyboardShortcuts(
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge> | null,
  undo: () => void,
  redo: () => void,
) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return
      }

      const key = event.key.toLowerCase()
      const hasCommandModifier = event.metaKey || event.ctrlKey

      if (hasCommandModifier && key === "z") {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }

      if (hasCommandModifier && key === "y") {
        event.preventDefault()
        redo()
        return
      }

      if (hasCommandModifier || event.altKey) {
        return
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault()
        void reactFlow?.zoomIn({ duration: VIEWPORT_ANIMATION_DURATION })
        return
      }

      if (event.key === "-") {
        event.preventDefault()
        void reactFlow?.zoomOut({ duration: VIEWPORT_ANIMATION_DURATION })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [reactFlow, redo, undo])
}
