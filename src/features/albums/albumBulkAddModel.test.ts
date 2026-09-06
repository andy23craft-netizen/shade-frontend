import { describe, expect, it } from 'vitest'
import { albumBulkStorageKey, canImportAlbum, emptyAlbumDraft, loadAlbumBulkSession, type AlbumBulkQueueItem } from './albumBulkAddModel'

const item = (state: string): AlbumBulkQueueItem => ({ clientItemId: 'album-1', kind: 'barcode', value: '123', status: 'found', result: { client_item_id: 'album-1', status: 'found', catalog_state: state as never }, draft: { ...emptyAlbumDraft(), title: 'Blue', artistIds: ['artist-1'] } })

describe('albumBulkAddModel', () => {
    it('namespaces persisted album intake by library host', () => expect(albumBulkStorageKey('Jamie.Localhost')).toBe('shade:bulk-add:jamie.localhost:album:v1'))
    it('blocks deleted and ambiguous matches and requires explicit duplicate/acquisition choices', () => {
        expect(canImportAlbum(item('soft_deleted'))).toBe(false)
        expect(canImportAlbum(item('ambiguous'))).toBe(false)
        expect(canImportAlbum(item('owned'))).toBe(false)
        const duplicate = item('owned'); duplicate.draft.allowDuplicate = true
        expect(canImportAlbum(duplicate)).toBe(true)
        const wishlist = item('wishlist'); wishlist.result!.catalog_album_ids = ['album-id']; wishlist.draft.acquireWishlist = true
        expect(canImportAlbum(wishlist)).toBe(true)
    })
    it('ignores corrupt persisted state', () => expect(loadAlbumBulkSession({ getItem: () => '{' }, 'key')).toBeNull())
})
