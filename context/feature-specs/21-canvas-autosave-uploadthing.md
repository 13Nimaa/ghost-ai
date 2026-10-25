# Add Autosave and Loading for the Collaborative Canvas Using UploadThing

Implement autosave and loading for the collaborative canvas so project state is persisted before adding AI generation. Store the canvas JSON as a file in UploadThing, and store the returned file URL (and file key if useful for cleanup) on the Prisma project record.

## Important Constraints

- Use UploadThing instead of Vercel Blob. Do not install or use `@vercel/blob`.
- First inspect the existing project structure, Prisma schema, authentication/authorization patterns, Liveblocks integration, and package versions. Reuse existing conventions; do not guess architecture or rename unrelated code.
- Canvas state is JSON. Preserve its structure when saving and loading.
- **Check file privacy before implementing.** UploadThing's free plan may not include private-file support. Public file URLs are accessible to anyone who has the URL. Do not store sensitive/private canvas data in publicly accessible storage unless this is explicitly acceptable for the project. If private access is required and the current UploadThing plan cannot provide it, stop and explain the limitation before implementing a public-storage workaround.
- Never expose the UploadThing API token to the browser.

## What to Install

Use the current UploadThing server SDK appropriate for the project's existing Next.js setup:

```bash
npm install uploadthing
```

Do not install `@vercel/blob`.

Configure the required UploadThing token using the environment variable expected by the current SDK (typically `UPLOADTHING_TOKEN`) and document it in `.env.example` without adding a real secret. Follow the current official UploadThing docs for the installed SDK version.

## Implementation

### 1. Inspect and update the Prisma project schema

- Review `prisma/model/project.prisma` and the existing Prisma schema conventions.
- Add or reuse fields for the canvas file URL and, if needed, the UploadThing file key.
- Keep Prisma responsible for project metadata and the reference to the stored file; do not store the full canvas JSON in the database.
- Create and apply a migration using the project's existing workflow.
- Ensure the route verifies that the requested project exists and that the current user is authorized to access and modify it.

### 2. Add canvas save/load API routes

Create `PUT /api/projects/[projectId]/canvas`.

It should:

- Authenticate the request and verify the user is allowed to edit the project.
- Validate the request body as canvas JSON and reject malformed or excessively large payloads using a reasonable project-appropriate limit.
- Serialize the canvas JSON and upload it from the server using UploadThing's server-side API (for example, `UTApi` and `UTFile` from `uploadthing/server`, following the current SDK documentation).
- Use a clear JSON MIME type and filename.
- Save the resulting UploadThing file URL and file key/reference on the matching Prisma project record.
- Handle upload and database errors safely. Do not report success if either required operation fails.
- Avoid leaving orphaned files if the database update fails. Where practical, delete the newly uploaded file on failure.
- Since autosave can happen repeatedly, clean up the previous file after the new file reference has been committed successfully. Use the SDK's supported file deletion API and the stored file key. Do not delete the old file before the database update succeeds.
- Consider overlapping autosave requests so an older request cannot overwrite a newer canvas state. Use a simple, project-consistent approach if concurrency protection is needed.

Create `GET /api/projects/[projectId]/canvas`.

It should:

- Authenticate the request and verify the user is allowed to view the project.
- Read the saved canvas file URL from the Prisma project record.
- Return an appropriate empty-state response if no canvas has been saved yet.
- Fetch the saved JSON from the stored UploadThing URL on the server, check the fetch response, parse and validate the JSON, and return the canvas state.
- Handle missing, invalid, or unavailable files without exposing secrets or internal error details.

Use the actual UploadThing URL returned by the SDK. Do not construct storage URLs manually or rely on deprecated URL patterns.

### 3. Add an autosave hook in the existing `/hook` folder

- Follow the repository's existing naming and import conventions.
- Watch the canvas nodes and edges (and any other state required to faithfully restore the canvas).
- Debounce saves to avoid uploading on every small change.
- Save through the canvas API route.
- Track and expose `saving`, `saved`, and `error` states for the UI.
- Avoid saving before the initial canvas hydration/load has completed; otherwise, an empty initial state could overwrite the saved canvas.
- Avoid unnecessary duplicate saves and handle component unmounts or in-flight requests safely.
- If the project already uses Liveblocks for collaboration, integrate with its existing state flow rather than introducing a competing source of truth.

### 4. Load saved canvas state in the editor

- On editor initialization, wait until the Liveblocks room and its current state are ready.
- Check whether the room already has any nodes or edges.
- If the room has existing nodes or edges, skip loading the saved canvas entirely to avoid overwriting active collaborative state.
- If the room is empty, request `GET /api/projects/[projectId]/canvas`.
- If a saved canvas exists, validate its structure and load it using the editor's existing state-update mechanism.
- Do not mark the editor as ready for autosave until loading has either completed or been intentionally skipped.
- Handle empty responses and load failures without crashing the editor.

### 5. Add save status to the editor

Add a small status indicator near the existing Save button, using the project's current UI conventions:

- `Saving…` while a save is in progress.
- `Saved` after a successful save.
- `Save failed` (or the project's existing error pattern) if a save fails.

Make the status accessible and do not rely on color alone to communicate state.

## Storage Pattern

- Prisma stores project metadata, the UploadThing file URL, and any file key needed for cleanup.
- UploadThing stores the canvas JSON file.
- The browser communicates with the application's authenticated canvas API; the UploadThing API token remains server-side.

## Completion Checklist

- [ ] `uploadthing` is installed and configured; `@vercel/blob` is not used.
- [ ] UploadThing token is configured server-side and documented safely.
- [ ] Prisma supports the canvas file URL and any required file key.
- [ ] Save/load routes enforce authentication and project-level authorization.
- [ ] Save route uploads JSON through UploadThing and updates Prisma metadata.
- [ ] Replaced files are cleaned up safely after successful updates.
- [ ] Load route retrieves and validates the stored canvas JSON.
- [ ] Autosave is debounced and does not run before hydration completes.
- [ ] Existing Liveblocks state is not overwritten by saved state.
- [ ] The editor displays saving, saved, and error states.
- [ ] Privacy implications of public file URLs are addressed; do not silently expose private canvas data.
- [ ] `npm run build` passes.
