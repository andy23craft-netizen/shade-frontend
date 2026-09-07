import { resolveLibraryContext, type LibraryId } from './libraryContext'

export type ClientMediaScope = 'shared' | 'book' | 'album'

export interface LibraryClientNamespace {
    libraryId: LibraryId
    media: ClientMediaScope
    key: string
}

/**
 * Derive private client-state identity exclusively from the trusted hostname
 * mapping. URL parameters and API payloads must never supply this value.
 */
export function resolveLibraryClientNamespace(
    hostname: string,
    media: ClientMediaScope = 'shared',
): LibraryClientNamespace | null {
    const library = resolveLibraryContext(hostname)

    if (library === null) return null

    return {
        libraryId: library.id,
        media,
        key: `shade:${library.id}:${media}`,
    }
}

export function requireLibraryClientNamespace(
    hostname: string,
    media: ClientMediaScope = 'shared',
): LibraryClientNamespace {
    const namespace = resolveLibraryClientNamespace(hostname, media)

    if (namespace === null) {
        throw new Error('Client state is unavailable for an unknown library host.')
    }

    return namespace
}
