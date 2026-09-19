import { getLibraryIdentity, type LibraryId } from './libraryIdentity'
export type { LibraryId } from './libraryIdentity'

export interface LibraryContext { id: LibraryId; name: string; wordmark: string }

/** The host is only a client-state namespace; tenant resolution remains server-owned. */
export function resolveLibraryContext(hostname: string): LibraryContext {
    const id = hostname.trim().toLowerCase().replace(/\.$/u, '') || 'unknown-host'
    const identity = getLibraryIdentity()
    return { id, name: identity.libraryName, wordmark: identity.wordmark }
}

export function applyLibraryTheme(_context: LibraryContext | null, root: HTMLElement = document.documentElement): void {
    void _context
    const identity = getLibraryIdentity()
    root.dataset.library = identity.palette
    root.dataset.typographyAccent = identity.typographyAccent
}

export function formatLibraryDocumentTitle(pageTitle: string, _context: LibraryContext | null): string {
    void _context
    return `${pageTitle} — ${getLibraryIdentity().libraryName} — Shade`
}

export function applyLibraryDocumentMetadata(context: LibraryContext | null, pageTitle: string, target: Document = document): void {
    const libraryName = getLibraryIdentity().libraryName
    target.title = formatLibraryDocumentTitle(pageTitle, context)
    for (const [attribute, name] of [['property', 'og:title'], ['name', 'twitter:title']] as const) {
        let element = target.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`)
        if (!element) { element = target.createElement('meta'); element.setAttribute(attribute, name); target.head.append(element) }
        element.content = libraryName
    }
}

export function applyLibraryFavicon(_hostname: string, _target: Document = document): void {
    void _hostname
    void _target
}
export function getLibraryDisplayName(_context: LibraryContext | null): string { void _context; return getLibraryIdentity().wordmark }
export function getLibraryCoverMark(_context: LibraryContext | null): string { void _context; return 'SL' }
