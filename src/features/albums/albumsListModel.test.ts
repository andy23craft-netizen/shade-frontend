import { describe, expect, it } from 'vitest'
import { parseAlbumListParams, updateAlbumListParams } from './albumsListModel'

describe('albumsListModel', () => {
    it('round trips album-only filters and sort state', () => {
        const params = updateAlbumListParams(new URLSearchParams(), { artist: '  Miles Davis ', title: 'Kind', barcode: '123', mediaFormat: 'vinyl', placementState: 'unshelved', includeDeleted: true, sortBy: 'release_date', sortOrder: 'desc' })
        expect(params.toString()).toBe('artist=Miles+Davis&title=Kind&barcode=123&media_format=vinyl&placement_state=unshelved&include_deleted=true&sortBy=release_date&sortOrder=desc')
        expect(parseAlbumListParams(params)).toEqual({ artist: 'Miles Davis', title: 'Kind', barcode: '123', mediaFormat: 'vinyl', placementState: 'unshelved', includeDeleted: true, sortBy: 'release_date', sortOrder: 'desc' })
    })
    it('rejects invalid values and ignores book fields', () => expect(parseAlbumListParams(new URLSearchParams('media_format=book&placement_state=lost&sortBy=pages&is_read=true'))).toEqual({ artist: undefined, title: undefined, barcode: undefined, mediaFormat: undefined, placementState: undefined, includeDeleted: false, sortBy: 'artist', sortOrder: 'asc' }))
})
