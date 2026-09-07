import { requireLibraryClientNamespace } from '../../config/libraryNamespace'

export type GuidedSetupMedia = 'book' | 'album'

export interface GuidedSetupDestination {
    shelfId: string
    shelfName: string
}

export interface GuidedSetupSession {
    version: 1
    sessionId: string
    selectedMedia: GuidedSetupMedia | null
    destinations: Partial<Record<GuidedSetupMedia, GuidedSetupDestination>>
    nextClientSequence: Record<GuidedSetupMedia, number>
}

export function guidedSetupStorageKey(hostname: string): string {
    const namespace = requireLibraryClientNamespace(hostname)
    return `${namespace.key}:guided-setup:v1`
}

export function createGuidedSetupSession(
    sessionId: string = crypto.randomUUID(),
): GuidedSetupSession {
    return {
        version: 1,
        sessionId,
        selectedMedia: null,
        destinations: {},
        nextClientSequence: { book: 1, album: 1 },
    }
}

function isMedia(value: unknown): value is GuidedSetupMedia {
    return value === 'book' || value === 'album'
}

function isDestination(value: unknown): value is GuidedSetupDestination {
    if (typeof value !== 'object' || value === null) return false
    const candidate = value as Record<string, unknown>
    return typeof candidate.shelfId === 'string' && candidate.shelfId.length > 0 &&
        typeof candidate.shelfName === 'string' && candidate.shelfName.length > 0
}

export function loadGuidedSetupSession(
    storage: Pick<Storage, 'getItem'>,
    key: string,
): GuidedSetupSession | null {
    try {
        const value = JSON.parse(storage.getItem(key) ?? 'null') as unknown
        if (typeof value !== 'object' || value === null) return null
        const candidate = value as Record<string, unknown>
        const destinations = candidate.destinations as Record<string, unknown> | undefined
        const sequences = candidate.nextClientSequence as Record<string, unknown> | undefined
        if (candidate.version !== 1 || typeof candidate.sessionId !== 'string' || candidate.sessionId.length === 0) return null
        if (candidate.selectedMedia !== null && !isMedia(candidate.selectedMedia)) return null
        if (!destinations || !sequences) return null
        if (destinations.book !== undefined && !isDestination(destinations.book)) return null
        if (destinations.album !== undefined && !isDestination(destinations.album)) return null
        if (!Number.isInteger(sequences.book) || (sequences.book as number) < 1) return null
        if (!Number.isInteger(sequences.album) || (sequences.album as number) < 1) return null

        return {
            version: 1,
            sessionId: candidate.sessionId,
            selectedMedia: candidate.selectedMedia as GuidedSetupMedia | null,
            destinations: {
                ...(destinations.book ? { book: destinations.book as GuidedSetupDestination } : {}),
                ...(destinations.album ? { album: destinations.album as GuidedSetupDestination } : {}),
            },
            nextClientSequence: {
                book: sequences.book as number,
                album: sequences.album as number,
            },
        }
    } catch {
        return null
    }
}

export function saveGuidedSetupSession(
    storage: Pick<Storage, 'setItem'>,
    key: string,
    session: GuidedSetupSession,
): void {
    storage.setItem(key, JSON.stringify(session))
}

export function selectGuidedSetupMedia(
    session: GuidedSetupSession,
    media: GuidedSetupMedia,
): GuidedSetupSession {
    return { ...session, selectedMedia: media }
}

export function setGuidedSetupDestination(
    session: GuidedSetupSession,
    media: GuidedSetupMedia,
    destination: GuidedSetupDestination,
): GuidedSetupSession {
    return {
        ...session,
        selectedMedia: media,
        destinations: { ...session.destinations, [media]: destination },
    }
}

export function allocateGuidedSetupClientItemId(
    session: GuidedSetupSession,
    media: GuidedSetupMedia,
): { clientItemId: string; session: GuidedSetupSession } {
    const sequence = session.nextClientSequence[media]
    return {
        clientItemId: `${media}-${session.sessionId}-${sequence}`,
        session: {
            ...session,
            nextClientSequence: {
                ...session.nextClientSequence,
                [media]: sequence + 1,
            },
        },
    }
}
