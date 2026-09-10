import { describe, expect, it } from 'vitest'
import { parseAlbumListParams, updateAlbumListParams } from './albumsListModel'

describe('albumsListModel', () => {
    it('round trips album-only filters and sort state', () => {
        const params = updateAlbumListParams(new URLSearchParams(), { search: '  Miles Davis ', barcode: '123', genreIds: ['jazz', 'fusion', 'jazz'], placementState: 'unshelved', sortBy: 'release_date', sortOrder: 'desc' })
        expect(params.toString()).toBe('search=Miles+Davis&barcode=123&placement_state=unshelved&genre_id=jazz&genre_id=fusion&sortBy=release_date&sortOrder=desc')
        expect(parseAlbumListParams(params)).toEqual({ search: 'Miles Davis', barcode: '123', genreIds: ['jazz', 'fusion'], placementState: 'unshelved', sortBy: 'release_date', sortOrder: 'desc' })
    })
    it('rejects invalid values and ignores obsolete or book-only fields', () => expect(parseAlbumListParams(new URLSearchParams('artist=Miles&title=Kind&include_deleted=true&placement_state=lost&sortBy=pages&is_read=true'))).toEqual({ search: undefined, barcode: undefined, genreIds: [], placementState: undefined, sortBy: 'artist', sortOrder: 'asc' }))
})
