import type { CSSProperties, PointerEvent } from "react"

import { cn } from "@/lib/utils"
import { NODE_COLORS, type CanvasNodeColor } from "@/types/canvas"

interface NodeColorToolbarProps {
  activeColor: CanvasNodeColor
  onSelect: (color: CanvasNodeColor) => void
}

interface SwatchStyle extends CSSProperties {
  "--swatch-glow": string
}

export function NodeColorToolbar({
  activeColor,
  onSelect,
}: NodeColorToolbarProps) {
  function stopCanvasInteraction(event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation()
  }

  return (
    <div
      aria-label="Node colors"
      className="nodrag nopan nowheel absolute bottom-full left-1/2 z-30 mb-3 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-surface-border bg-elevated/95 p-2 shadow-lg backdrop-blur"
      onPointerDown={stopCanvasInteraction}
      onPointerMove={stopCanvasInteraction}
      role="toolbar"
    >
      {NODE_COLORS.map((color) => {
        const isActive = color.fill === activeColor.fill
        const style: SwatchStyle = {
          "--swatch-glow": color.text,
          backgroundColor: color.fill,
          borderColor: color.text,
        }

        return (
          <button
            key={color.fill}
            aria-label={`Use ${color.name} node colors`}
            aria-pressed={isActive}
            className={cn(
              "h-5 w-5 rounded-full border transition-[box-shadow,transform] duration-150",
              isActive
                ? "scale-110 shadow-[0_0_0_2px_var(--bg-elevated),0_0_0_4px_var(--swatch-glow)]"
                : "hover:scale-110 hover:shadow-[0_0_0_2px_var(--swatch-glow)]",
            )}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(color)
            }}
            style={style}
            title={color.name}
            type="button"
          />
        )
      })}
    </div>
  )
}
