import { describe, expect, it } from 'vitest'
import { buildAlbumFormPayload } from './albumFormPayload'

describe('buildAlbumFormPayload', () => {
    it('omits absent optional create values', () => expect(buildAlbumFormPayload({ title: ' Blue ', artistIds: ['a'], genreIds: [], mediaFormat: 'vinyl', shelf: '', barcode: '', label: '', releaseDate: '', notes: '', tracks: [] })).toEqual({ title: 'Blue', person_ids: ['a'], media_format: 'vinyl', is_played: false, status: 'available' }))
})
