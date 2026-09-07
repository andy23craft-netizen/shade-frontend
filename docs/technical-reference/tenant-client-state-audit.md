# Tenant-safe client state audit

Audit completed for FEAT-07 on 2026-09-06. Private client state is scoped by
`resolveLibraryClientNamespace`, which accepts only the browser hostname and resolves it through
the trusted local library mapping. Unknown hosts receive no namespace and render before providers,
API clients, diagnostics, or product routes mount.

| Surface | Owner | Namespace | Lifetime | Cleanup / isolation rule |
| --- | --- | --- | --- | --- |
| React Query JSON data, mutations, and binary Blobs | `AppProviders`, API query hooks | One QueryClient per document/app mount; library settings additionally key by canonical library ID | Current application mount; memory only | Route observer teardown cancels query signals. A hostname navigation reloads the document and creates a new client. No query persistence is installed. |
| Book cover object URLs | `BookCover` | Owning component within the active app client | While the displayed Blob is mounted | `URL.revokeObjectURL` runs when the Blob changes or the component unmounts. Unknown-host rendering never mounts it. |
| Album artwork object URLs | `AlbumArtwork` | Owning component within the active app client | While the displayed Blob is mounted | `URL.revokeObjectURL` runs when the Blob changes or the component unmounts. Unknown-host rendering never mounts it. |
| Queued cover download slots | `coverRequestLimiter` | Module scheduler only; contains signals/callbacks, no media or tenant payload | Until acquired or aborted | Query cancellation aborts queued work; aborted waiters are removed and cannot execute. Results can reach only their originating QueryClient. |
| Album Build Mode session | `AlbumBulkAddPage` | `shade:<canonical-library-id>:album:bulk-add:v1` | Local storage until cancel/finish | Destination, stable client IDs, drafts, lookup results, validation/save state, and sequence remain together in the scoped record. Legacy unscoped records are deleted and produce a one-time safety notice. Corrupt records are ignored. |
| Book Build Mode session | `BulkAddPage` | None (currently memory-only) | Current route mount | Drafts, scanner results, destination, validation, and save results disappear on unmount. Future resume work must use `shade:<library-id>:book:*`. |
| Setup/settings state | library query hooks | Canonical library ID under `library` query keys | Current app mount | No setup session is persisted. API/bootstrap failures cannot create an empty setup session. |
| Route filters and selection | React Router URL state and route components | Current origin URL or component memory | Navigation/history or route mount | Hostnames are distinct origins/documents; no filter snapshot is copied to another host. Unknown hosts mount no product routes. |
| Form dialogs and intake/scanner state | Feature components | Component memory | Component mount | Unmount clears drafts, scan results, validation, and outcomes; async query/mutation observers detach. |
| Notifications | `NotificationsProvider` | Provider instance | Current app mount | IDs contain no product data; notices and counters reset with the provider. |
| Diagnostics | `createDiagnosticReporter` | Canonical allowlisted `libraryId` derived before reporter creation | Current document | Payload schema includes event, release, library ID, operation, and safe error classification only. Existing redaction rejects tokens, bodies, borrower data, notes, ISBNs, filenames/Blobs, and database content. Unknown hosts never create a reporter. |
| Shared product preferences | None | N/A | N/A | No persistent shared preferences currently exist. Any future non-private preference must be explicitly classified; private data may not use an unscoped key. |

Browser requests continue to rely on the reverse proxy for tenant selection. JavaScript does not
send `X-Forwarded-Host`, `Library-Username`, or a tenant value derived from URL parameters or API
content. Moving between known library hosts is a normal full-page navigation; in-place tenant
switching is intentionally not implemented.
