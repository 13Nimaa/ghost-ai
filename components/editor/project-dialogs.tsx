"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditorDialog } from "@/components/editor/editor-dialog"
import type { ProjectDialogsController } from "@/components/editor/use-project-dialogs"

export function ProjectDialogs({
  dialogs,
}: {
  dialogs: ProjectDialogsController
}) {
  return (
    <>
      <CreateProjectDialog dialogs={dialogs} />
      <RenameProjectDialog dialogs={dialogs} />
      <DeleteProjectDialog dialogs={dialogs} />
    </>
  )
}

function CreateProjectDialog({
  dialogs,
}: {
  dialogs: ProjectDialogsController
}) {
  const open = dialogs.activeDialog === "create"

  return (
    <EditorDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dialogs.closeDialog()
      }}
      title="Create project"
      description="Give your architecture workspace a name."
      footer={
        <>
          <Button
            variant="outline"
            onClick={dialogs.closeDialog}
            disabled={dialogs.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={dialogs.submitCreate}
            disabled={
              dialogs.isSubmitting || dialogs.name.trim().length === 0
            }
            className="bg-accent-dim text-brand hover:bg-brand/20"
          >
            {dialogs.isSubmitting ? "Creating…" : "Create project"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          dialogs.submitCreate()
        }}
        className="flex flex-col gap-2"
      >
        <Input
          value={dialogs.name}
          onChange={(event) => dialogs.setName(event.target.value)}
          placeholder="My project"
          aria-label="Project name"
          autoFocus={open}
        />
        <p className="text-sm text-copy-muted">
          Slug:{" "}
          <span className="font-mono text-copy-secondary">
            {dialogs.slugPreview || "—"}
          </span>
        </p>
      </form>
    </EditorDialog>
  )
}

function RenameProjectDialog({
  dialogs,
}: {
  dialogs: ProjectDialogsController
}) {
  const open = dialogs.activeDialog === "rename"

  return (
    <EditorDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dialogs.closeDialog()
      }}
      title="Rename project"
      description={
        dialogs.selectedProject
          ? `Currently named "${dialogs.selectedProject.name}".`
          : undefined
      }
      footer={
        <>
          <Button
            variant="outline"
            onClick={dialogs.closeDialog}
            disabled={dialogs.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={dialogs.submitRename}
            disabled={
              dialogs.isSubmitting || dialogs.name.trim().length === 0
            }
            className="bg-accent-dim text-brand hover:bg-brand/20"
          >
            {dialogs.isSubmitting ? "Renaming…" : "Rename project"}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          dialogs.submitRename()
        }}
      >
        <Input
          value={dialogs.name}
          onChange={(event) => dialogs.setName(event.target.value)}
          placeholder="Project name"
          aria-label="Project name"
          autoFocus={open}
        />
      </form>
    </EditorDialog>
  )
}

function DeleteProjectDialog({
  dialogs,
}: {
  dialogs: ProjectDialogsController
}) {
  return (
    <EditorDialog
      open={dialogs.activeDialog === "delete"}
      onOpenChange={(next) => {
        if (!next) dialogs.closeDialog()
      }}
      title="Delete project"
      description={
        dialogs.selectedProject
          ? `Are you sure you want to delete "${dialogs.selectedProject.name}"? This action cannot be undone.`
          : "Are you sure you want to delete this project? This action cannot be undone."
      }
      footer={
        <>
          <Button
            variant="outline"
            onClick={dialogs.closeDialog}
            disabled={dialogs.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={dialogs.submitDelete}
            disabled={dialogs.isSubmitting}
          >
            {dialogs.isSubmitting ? "Deleting…" : "Delete project"}
          </Button>
        </>
      }
    />
  )
}
