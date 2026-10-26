export interface ProjectSpecListItem {
  id: string
  createdAt: string
  filename: string
}

export function getSpecFilename(projectId: string, specId: string): string {
  return `project-${projectId}-spec-${specId}.md`.replace(
    /[^a-zA-Z0-9._-]/g,
    "_",
  )
}

export function getSpecDownloadPath(projectId: string, specId: string): string {
  return `/api/projects/${projectId}/specs/${specId}/download`
}

export function formatSpecCreatedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown date"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
