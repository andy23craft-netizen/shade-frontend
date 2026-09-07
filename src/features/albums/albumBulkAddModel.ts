import type { BulkAlbumLookupItemResult, MediaFormat } from '../../api/apiTypes'
import { requireLibraryClientNamespace } from '../../config/libraryNamespace'

export type AlbumCaptureKind = 'barcode' | 'discogs' | 'manual'

export interface AlbumBulkDraft {
    title: string
    artistIds: string[]
    genreIds: string[]
    artistNames: string[]
    genreNames: string[]
    barcode: string
    discogsReleaseId: string
    musicbrainzReleaseId: string
    label: string
    releaseDate: string
    mediaFormat: MediaFormat
    acquireWishlist: boolean
    allowDuplicate: boolean
}

export interface AlbumBulkQueueItem {
    clientItemId: string
    kind: AlbumCaptureKind
    value: string
    status: 'queued' | 'looking_up' | 'found' | 'not_found' | 'invalid_identifier' | 'provider_timeout' | 'provider_failure' | 'lookup_failed'
    result?: BulkAlbumLookupItemResult
    draft: AlbumBulkDraft
    saveStatus?: string
    saveDetail?: string
}

export interface AlbumBulkSession {
    shelfName: string
    started: boolean
    queue: AlbumBulkQueueItem[]
    nextSequence: number
}

export const emptyAlbumDraft = (): AlbumBulkDraft => ({ title: '', artistIds: [], genreIds: [], artistNames: [], genreNames: [], barcode: '', discogsReleaseId: '', musicbrainzReleaseId: '', label: '', releaseDate: '', mediaFormat: 'unknown', acquireWishlist: false, allowDuplicate: false })

export function albumBulkStorageKey(hostname: string): string {
    const namespace = requireLibraryClientNamespace(hostname, 'album')
    return `${namespace.key}:bulk-add:v1`
}

const LEGACY_UNSCOPED_ALBUM_KEYS = [
    'shade:bulk-add:album:v1',
    'shade:album-bulk-add:v1',
] as const

export function discardLegacyUnscopedAlbumBulkSession(
    storage: Pick<Storage, 'getItem' | 'removeItem'>,
): boolean {
    const found = LEGACY_UNSCOPED_ALBUM_KEYS.some((key) => storage.getItem(key) !== null)
    for (const key of LEGACY_UNSCOPED_ALBUM_KEYS) storage.removeItem(key)
    return found
}

export function loadAlbumBulkSession(storage: Pick<Storage, 'getItem'>, key: string): AlbumBulkSession | null {
    try {
        const parsed = JSON.parse(storage.getItem(key) ?? 'null') as AlbumBulkSession | null
        return parsed && Array.isArray(parsed.queue) && typeof parsed.nextSequence === 'number' ? parsed : null
    } catch { return null }
}

export function draftFromAlbumLookup(result: BulkAlbumLookupItemResult): AlbumBulkDraft {
    const draft = result.draft
    return {
        ...emptyAlbumDraft(),
        title: draft?.title?.trim() ?? '',
        artistNames: (draft?.artists ?? []).map(a => [a.first_name, a.surname].filter(Boolean).join(' ')),
        genreNames: draft?.genres ?? [],
        barcode: result.barcode ?? draft?.barcode ?? '',
        discogsReleaseId: result.discogs_release_id ?? draft?.discogs_release_id ?? '',
        musicbrainzReleaseId: draft?.musicbrainz_release_id ?? '',
        label: draft?.label ?? '',
        releaseDate: draft?.release_date ?? '',
        mediaFormat: draft?.media_format ?? 'unknown',
    }
}

export const albumCatalogStateLabel = (state?: string | null): string => ({ new: 'New', owned: 'Already owned', wishlist: 'Wishlisted', unshelved: 'Unshelved', ambiguous: 'Ambiguous match', soft_deleted: 'Soft-deleted match' }[state ?? ''] ?? 'Needs review')
export const albumLookupStatusLabel = (status: AlbumBulkQueueItem['status']): string => ({ queued: 'Queued', looking_up: 'Looking up', found: 'Found', not_found: 'Not found', invalid_identifier: 'Invalid identifier', provider_timeout: 'Provider timeout', provider_failure: 'Provider failure', lookup_failed: 'Lookup failed' }[status])

export function canImportAlbum(item: AlbumBulkQueueItem): boolean {
    if (item.saveStatus === 'created' || item.saveStatus === 'wishlist_acquired') return false
    if (!item.draft.title.trim() || item.draft.artistIds.length === 0) return false
    const state = item.result?.catalog_state
    if (state === 'owned' || state === 'unshelved' || state === 'ambiguous' || state === 'soft_deleted') return state === 'owned' && item.draft.allowDuplicate
    if (state === 'wishlist') return item.draft.acquireWishlist && item.result?.catalog_album_ids?.length === 1
    return true
}
