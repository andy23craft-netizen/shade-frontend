import { requireLibraryClientNamespace } from '../../config/libraryNamespace'
import type { BulkAddQueueItem } from './bulkAddModel'

export interface BulkAddDraft {
    title: string
    authors: string
    publisher: string
    publicationDate: string
    isbnNotApplicable: boolean
    pages: string
    categoryIds: string[]
    acquireWishlist: boolean
    allowDuplicate: boolean
}

export interface PersistedBookBulkSession {
    version: 1
    shelfName: string
    acquisitionSource: string
    sessionStarted: boolean
    queue: BulkAddQueueItem[]
    drafts: Record<string, BulkAddDraft>
    savedIds: string[]
    importErrors: Array<[string, string]>
    nextClientSequence: number
}

export function emptyBulkAddDraft(): BulkAddDraft {
    return { title: '', authors: '', publisher: '', publicationDate: '', isbnNotApplicable: false, pages: '', categoryIds: [], acquireWishlist: false, allowDuplicate: false }
}

export function bookBulkStorageKey(hostname: string): string {
    return `${requireLibraryClientNamespace(hostname, 'book').key}:bulk-add:v1`
}

export function loadBookBulkSession(
    storage: Pick<Storage, 'getItem'>,
    key: string,
): PersistedBookBulkSession | null {
    try {
        const value = JSON.parse(storage.getItem(key) ?? 'null') as unknown
        if (typeof value !== 'object' || value === null) return null
        const session = value as Record<string, unknown>
        if (session.version !== 1 || typeof session.shelfName !== 'string' ||
            typeof session.acquisitionSource !== 'string' || typeof session.sessionStarted !== 'boolean' ||
            !Array.isArray(session.queue) || typeof session.drafts !== 'object' || session.drafts === null ||
            !Array.isArray(session.savedIds) || !session.savedIds.every((id) => typeof id === 'string') ||
            !Array.isArray(session.importErrors) || !session.importErrors.every((entry) => Array.isArray(entry) && entry.length === 2 && entry.every((part) => typeof part === 'string')) ||
            !Number.isInteger(session.nextClientSequence) || (session.nextClientSequence as number) < 1) return null
        if (!session.queue.every((item) => typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).clientItemId === 'string')) return null

        const restored = session as unknown as PersistedBookBulkSession
        return {
            ...restored,
            drafts: Object.fromEntries(
                Object.entries(restored.drafts).map(([id, draft]) => [
                    id,
                    {
                        ...emptyBulkAddDraft(),
                        ...draft,
                        isbnNotApplicable:
                            draft.isbnNotApplicable === true,
                        allowDuplicate:
                            draft.allowDuplicate === true,
                    },
                ]),
            ),
            queue: restored.queue.map((item) => item.status === 'looking_up'
                ? { ...item, status: 'queued' }
                : item),
        }
    } catch {
        return null
    }
}

export function saveBookBulkSession(
    storage: Pick<Storage, 'setItem'>,
    key: string,
    session: PersistedBookBulkSession,
): void {
    storage.setItem(key, JSON.stringify(session))
}
