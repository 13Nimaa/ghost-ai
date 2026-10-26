import { UTFile } from "uploadthing/server"

import { getUploadThingApi } from "@/lib/uploadthing"

export interface UploadedSpecArtifact {
  fileKey: string
  filePath: string
}

export async function uploadSpecArtifact(
  projectId: string,
  content: string,
): Promise<UploadedSpecArtifact> {
  const file = new UTFile(
    [content],
    `project-${projectId}-spec-${Date.now()}.md`,
    { type: "text/markdown" },
  )
  const result = await getUploadThingApi().uploadFiles(file, {
    contentDisposition: "attachment",
  })

  if (!result.data) {
    throw new Error(result.error?.message ?? "Failed to upload generated spec")
  }

  return {
    fileKey: result.data.key,
    filePath: result.data.ufsUrl,
  }
}

export async function deleteSpecArtifact(fileKey: string): Promise<void> {
  await getUploadThingApi().deleteFiles(fileKey)
}
