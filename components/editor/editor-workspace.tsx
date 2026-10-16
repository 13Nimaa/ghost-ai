export function EditorWorkspace({ projectName }: { projectName: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-xl font-medium text-copy-primary">
        {projectName}
      </h1>
      <p className="max-w-sm text-sm text-copy-muted">
        The collaborative canvas for this workspace is coming soon. Use the
        sidebar to switch projects or create a new one.
      </p>
    </div>
  )
}
