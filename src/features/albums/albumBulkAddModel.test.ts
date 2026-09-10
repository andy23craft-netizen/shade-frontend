import { describe, expect, it } from 'vitest'
import { albumBulkStorageKey, canImportAlbum, discardLegacyUnscopedAlbumBulkSession, emptyAlbumDraft, loadAlbumBulkSession, type AlbumBulkQueueItem } from './albumBulkAddModel'

const item = (state: string): AlbumBulkQueueItem => ({ clientItemId: 'album-1', kind: 'barcode', value: '123', status: 'found', result: { client_item_id: 'album-1', status: 'found', catalog_state: state as never }, draft: { ...emptyAlbumDraft(), title: 'Blue', artistIds: ['artist-1'] } })

describe('albumBulkAddModel', () => {
    it('namespaces persisted album intake by canonical library and media', () => {
        expect(albumBulkStorageKey('Jamie.Localhost')).toBe('shade:jamie:album:bulk-add:v1')
        expect(albumBulkStorageKey('jamie.library.spir.es')).toBe('shade:jamie:album:bulk-add:v1')
        expect(albumBulkStorageKey('andy.localhost')).not.toBe(albumBulkStorageKey('jamie.localhost'))
    })
    it('blocks ambiguous matches and requires explicit duplicate/acquisition choices', () => {
        expect(canImportAlbum(item('ambiguous'))).toBe(false)
        expect(canImportAlbum(item('owned'))).toBe(false)
        const duplicate = item('owned'); duplicate.draft.allowDuplicate = true
        expect(canImportAlbum(duplicate)).toBe(true)
        const wishlist = item('wishlist'); wishlist.result!.catalog_album_ids = ['album-id']; wishlist.draft.acquireWishlist = true
        expect(canImportAlbum(wishlist)).toBe(true)
    })
    it('ignores corrupt persisted state', () => expect(loadAlbumBulkSession({ getItem: () => '{' }, 'key')).toBeNull())

    it('requeues lookup work interrupted by browser closure', () => {
        const queued = item('new')
        queued.status = 'looking_up'
        const raw = JSON.stringify({ shelfName: 'blue', started: true, queue: [queued], nextSequence: 2 })
        expect(loadAlbumBulkSession({ getItem: () => raw }, 'key')?.queue[0]?.status).toBe('queued')
    })

    it('discards legacy unscoped data once instead of restoring it', () => {
        const values = new Map([['shade:bulk-add:album:v1', '{"private":"draft"}']])
        const storage = { getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => values.delete(key) }
        expect(discardLegacyUnscopedAlbumBulkSession(storage)).toBe(true)
        expect(discardLegacyUnscopedAlbumBulkSession(storage)).toBe(false)
    })
})
