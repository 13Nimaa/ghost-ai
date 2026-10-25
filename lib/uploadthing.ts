import { UTApi } from "uploadthing/server"

let uploadThingApi: UTApi | null = null

/**
 * Returns the server-side UploadThing client for generated file artifacts
 * (e.g. Markdown specs). Canvas autosave uses Postgres `canvasJson` instead.
 * The API token is read from `UPLOADTHING_TOKEN` and must never be exposed
 * to the browser.
 */
export function getUploadThingApi(): UTApi {
  if (uploadThingApi) {
    return uploadThingApi
  }

  const token = process.env.UPLOADTHING_TOKEN

  if (!token) {
    throw new Error("UPLOADTHING_TOKEN is not configured")
  }

  uploadThingApi = new UTApi({ token, logLevel: "Error" })

  return uploadThingApi
}
