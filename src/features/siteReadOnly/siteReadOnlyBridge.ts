type SiteReadOnlyHandler = () => void

let handler: SiteReadOnlyHandler | null = null

/** Registers the live handler used by apiClient when a mutating request returns HTTP 530. */
export function registerSiteReadOnlyHandler(
    next: SiteReadOnlyHandler | null,
): void {
    handler = next
}

/** Notifies the registered provider that the site has entered read-only mode. */
export function notifySiteEnteredReadOnly(): void {
    handler?.()
}
