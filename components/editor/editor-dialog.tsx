"use client"

import type { ReactNode } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface EditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  className?: string
  footer?: ReactNode
  children?: ReactNode
}

export function EditorDialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  footer,
  children,
}: EditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "overflow-hidden rounded-3xl border border-surface-border bg-elevated text-copy-primary backdrop-blur",
          className
        )}
      >
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle className="truncate text-copy-primary">
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="text-copy-muted">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {children}

        {footer ? (
          <DialogFooter className="shrink-0">{footer}</DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
