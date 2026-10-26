"use client"

import { Loader2 } from "lucide-react"
import { useViewport } from "@xyflow/react"
import { useOthers } from "@liveblocks/react/suspense"

const FALLBACK_COLOR = "var(--text-secondary)"

interface CollaboratorCursor {
  connectionId: number
  cursor: { x: number; y: number }
  color: string
  name: string
  thinking: boolean
}

export function LiveCursors() {
  const others = useOthers()
  const { x, y, zoom } = useViewport()

  const cursors: CollaboratorCursor[] = []

  for (const other of others) {
    const cursor = other.presence.cursor

    if (!cursor) {
      continue
    }

    cursors.push({
      connectionId: other.connectionId,
      cursor,
      color: other.info?.color ?? FALLBACK_COLOR,
      name: other.info?.name ?? "",
      thinking: other.presence.thinking === true,
    })
  }

  if (cursors.length === 0) {
    return null
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[4] overflow-hidden"
    >
      {cursors.map(({ connectionId, cursor, color, name, thinking }) => (
        <div
          key={connectionId}
          className="absolute left-0 top-0"
          style={{
            transform: `translate(${cursor.x * zoom + x}px, ${
              cursor.y * zoom + y
            }px)`,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          >
            <path
              d="M3 2L17.2 9.4L10.8 11.5L8.2 17.8L3 2Z"
              fill={color}
              stroke="var(--bg-base)"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
          {name || thinking ? (
            <span
              className="ml-3.5 mt-3 inline-flex max-w-48 items-center gap-1.5 truncate rounded-md px-2 py-0.5 text-xs font-medium leading-tight text-copy-primary shadow-sm"
              style={{ backgroundColor: color }}
            >
              {thinking ? (
                <Loader2
                  className="h-3 w-3 shrink-0 animate-spin text-copy-primary"
                  aria-hidden
                />
              ) : null}
              <span className="truncate">{name || "AI"}</span>
            </span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
