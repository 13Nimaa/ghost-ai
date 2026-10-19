"use client"

import { Check, Link2, Mail, Trash2, Users } from "lucide-react"
import Image from "next/image"

import { EditorDialog } from "@/components/editor/editor-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Collaborator } from "@/lib/collaborators"
import type { ShareDialogController } from "@/hooks/use-share-dialog"
import { cn } from "@/lib/utils"

export function ShareDialog({
  controller,
}: {
  controller: ShareDialogController
}) {
  const total = (controller.owner ? 1 : 0) + controller.collaborators.length

  return (
    <EditorDialog
      open={controller.isOpen}
      onOpenChange={(next) => {
        if (!next) controller.close()
      }}
      title="Share project"
      description="Invite collaborators, copy the workspace link, and manage access."
      className="sm:max-w-md"
    >
      <div className="-mx-4 border-t border-surface-border" />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-subtle-border bg-surface/60 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-copy-primary">
              Workspace link
            </p>
            <p className="mt-0.5 text-xs text-copy-muted">
              Share a direct link with teammates after you grant them access.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={controller.copyLink}
            className="shrink-0 rounded-full border-surface-border bg-elevated text-copy-primary hover:bg-subtle"
          >
            {controller.copied ? <Check /> : <Link2 />}
            {controller.copied ? "Copied!" : "Copy link"}
          </Button>
        </div>

        {controller.isOwner ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              controller.invite()
            }}
            className="relative"
          >
            <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-copy-faint" />
            <Input
              type="email"
              value={controller.email}
              onChange={(event) => controller.setEmail(event.target.value)}
              placeholder="teammate@company.com"
              aria-label="Collaborator email"
              autoComplete="email"
              className="h-11 rounded-full pr-24 pl-10 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={
                controller.isSubmitting || controller.email.trim().length === 0
              }
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full bg-brand px-4 text-on-brand hover:bg-brand/90"
            >
              Invite
            </Button>
          </form>
        ) : null}

        {controller.error ? (
          <p className="text-sm text-state-error">{controller.error}</p>
        ) : null}

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-copy-primary">
              People with access
            </p>
            <p className="text-xs text-copy-muted">{total} total</p>
          </div>

          {controller.isLoading ? (
            <p className="py-2 text-sm text-copy-muted">
              Loading collaborators…
            </p>
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <Users className="h-6 w-6 text-copy-faint" />
              <p className="text-sm text-copy-muted">No collaborators yet.</p>
            </div>
          ) : (
            <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {controller.owner ? (
                <AccessRow collaborator={controller.owner} role="owner" />
              ) : null}
              {controller.collaborators.map((collaborator) => (
                <AccessRow
                  key={collaborator.id}
                  collaborator={collaborator}
                  role="collaborator"
                  canRemove={controller.isOwner}
                  disabled={controller.isSubmitting}
                  onRemove={controller.remove}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </EditorDialog>
  )
}

type AccessRole = "owner" | "collaborator"

function AccessRow({
  collaborator,
  role,
  canRemove = false,
  disabled = false,
  onRemove,
}: {
  collaborator: Collaborator
  role: AccessRole
  canRemove?: boolean
  disabled?: boolean
  onRemove?: (collaboratorId: string) => void
}) {
  const label = collaborator.name ?? (collaborator.email || "Project owner")
  const initial = label.trim().charAt(0).toUpperCase() || "?"

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-subtle-border bg-surface/40 px-3 py-2.5">
      {collaborator.imageUrl ? (
        <Image
          src={collaborator.imageUrl}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-medium",
            role === "owner"
              ? "bg-accent-dim text-brand"
              : "bg-ai/15 text-ai-text"
          )}
        >
          {initial}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-copy-primary">{label}</p>
        {collaborator.email ? (
          <p className="truncate text-xs text-copy-muted">
            {collaborator.email}
          </p>
        ) : null}
      </div>

      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase",
          role === "owner"
            ? "border-brand/40 bg-accent-dim text-brand"
            : "border-subtle-border bg-subtle text-copy-muted"
        )}
      >
        {role === "owner" ? "Owner" : "Collaborator"}
      </span>

      {canRemove && onRemove ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${collaborator.email}`}
          disabled={disabled}
          onClick={() => onRemove(collaborator.id)}
          className="shrink-0 text-copy-muted hover:text-state-error"
        >
          <Trash2 />
        </Button>
      ) : null}
    </li>
  )
}
