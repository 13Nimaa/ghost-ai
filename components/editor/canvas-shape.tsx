import { cn } from "@/lib/utils"
import type { CanvasShape } from "@/types/canvas"

interface CanvasShapeVisualProps {
  shape: CanvasShape
  color: string
  label?: string
  selected?: boolean
  className?: string
}

export function CanvasShapeVisual({
  shape,
  color,
  label = "",
  selected = false,
  className,
}: CanvasShapeVisualProps) {
  const borderClassName = selected ? "border-brand" : "border-surface-border"

  if (shape === "rectangle" || shape === "pill" || shape === "circle") {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center border px-3 text-center text-base transition-colors text-copy-primary",
          borderClassName,
          shape === "rectangle" && "rounded-xl",
          shape === "pill" && "rounded-full",
          shape === "circle" && "rounded-full",
          className,
        )}
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center text-center text-base text-copy-primary",
        className,
      )}
    >
      <ShapeSvg color={color} selected={selected} shape={shape} />
      <span className="relative z-10 px-5 text-copy-primary">{label}</span>
    </div>
  )
}

interface ShapeSvgProps {
  shape: "diamond" | "hexagon" | "cylinder"
  color: string
  selected: boolean
}

function ShapeSvg({ shape, color, selected }: ShapeSvgProps) {
  const stroke = selected ? "var(--accent-primary)" : "var(--border-default)"
  const strokeWidth = selected ? 2 : 1
  const commonProps = {
    fill: color,
    stroke,
    strokeWidth,
    vectorEffect: "non-scaling-stroke" as const,
  }

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full overflow-visible transition-colors"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {shape === "diamond" ? (
        <polygon points="50,1 99,50 50,99 1,50" {...commonProps} />
      ) : null}
      {shape === "hexagon" ? (
        <polygon points="25,1 75,1 99,50 75,99 25,99 1,50" {...commonProps} />
      ) : null}
      {shape === "cylinder" ? (
        <>
          <path
            d="M2 14C2 6.8 23.5 1 50 1s48 5.8 48 13v72c0 7.2-21.5 13-48 13S2 93.2 2 86Z"
            {...commonProps}
          />
          <ellipse
            cx="50"
            cy="14"
            fill={color}
            rx="48"
            ry="13"
            stroke={stroke}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </svg>
  )
}
