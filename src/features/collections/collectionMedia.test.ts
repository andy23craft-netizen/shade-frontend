import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    CollectionRead,
} from '../../api/apiTypes'
import {
    collectionAcceptsMedia,
    collectionsForMedia,
} from './collectionMedia'

function collection(
    id: string,
    mediaType: CollectionRead['media_type'],
): CollectionRead {
    return {
        collection_id: id,
        name: id,
        description: null,
        media_type: mediaType,
        created_date: '2026-09-06T00:00:00Z',
        last_updated_date: '2026-09-06T00:00:00Z',
    }
}

describe('collection media eligibility', () => {
    const empty = collection('empty', null)
    const books = collection('books', 'book')
    const albums = collection('albums', 'album')

    it('allows either media type in an empty collection', () => {
        expect(collectionAcceptsMedia(empty, 'book')).toBe(true)
        expect(collectionAcceptsMedia(empty, 'album')).toBe(true)
    })

    it('allows only matching media in a populated collection', () => {
        expect(collectionAcceptsMedia(books, 'book')).toBe(true)
        expect(collectionAcceptsMedia(books, 'album')).toBe(false)
        expect(collectionAcceptsMedia(albums, 'album')).toBe(true)
        expect(collectionAcceptsMedia(albums, 'book')).toBe(false)
    })

    it('filters collection choices without excluding empty collections', () => {
        expect(
            collectionsForMedia(
                [empty, books, albums],
                'album',
            ).map((item) => item.collection_id),
        ).toEqual(['empty', 'albums'])
    })
})
