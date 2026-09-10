import { describe, expect, it } from 'vitest'
import { parseAlbumListParams, updateAlbumListParams } from './albumsListModel'

describe('albumsListModel', () => {
    it('round trips album-only filters and sort state', () => {
        const params = updateAlbumListParams(new URLSearchParams(), { artist: '  Miles Davis ', title: 'Kind', barcode: '123', placementState: 'unshelved', includeDeleted: true, sortBy: 'release_date', sortOrder: 'desc' })
        expect(params.toString()).toBe('artist=Miles+Davis&title=Kind&barcode=123&placement_state=unshelved&include_deleted=true&sortBy=release_date&sortOrder=desc')
        expect(parseAlbumListParams(params)).toEqual({ artist: 'Miles Davis', title: 'Kind', barcode: '123', placementState: 'unshelved', includeDeleted: true, sortBy: 'release_date', sortOrder: 'desc' })
    })
    it('rejects invalid values and ignores obsolete or book-only fields', () => expect(parseAlbumListParams(new URLSearchParams('media_format=vinyl&placement_state=lost&sortBy=pages&is_read=true'))).toEqual({ artist: undefined, title: undefined, barcode: undefined, placementState: undefined, includeDeleted: false, sortBy: 'artist', sortOrder: 'asc' }))
})
