import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    createCollectionsApi,
} from './collectionsApi'
import {
    createWishlistsApi,
} from './wishlistsApi'
import type {
    createApiClient,
} from './apiClient'

function client(): ReturnType<typeof createApiClient> {
    return {
        request: vi.fn(),
        requestJson: vi.fn(),
        get: vi.fn(),
        getJson: vi.fn(),
    }
}

describe('album curation transport', () => {
    it('uses typed wishlist note and atomic move routes', async () => {
        const apiClient = client()
        const api = createWishlistsApi(apiClient)

        await api.updateAlbum(
            'wish/list',
            'item/1',
            { notes: null },
        )
        await api.moveAlbumToShelf(
            'wish/list',
            'item/1',
            { shelf_name: 'music' },
        )

        expect(apiClient.requestJson).toHaveBeenNthCalledWith(
            1,
            '/wishlists/wish%2Flist/albums/item%2F1',
            { method: 'PATCH', body: { notes: null } },
        )
        expect(apiClient.requestJson).toHaveBeenNthCalledWith(
            2,
            '/wishlists/wish%2Flist/albums/item%2F1/move-to-shelf',
            { method: 'POST', body: { shelf_name: 'music' } },
        )
    })

    it('uses collection_album_id for album update and removal', async () => {
        const apiClient = client()
        const api = createCollectionsApi(apiClient)

        await api.listAlbums('collection/1', { skip: 2, take: 4 })
        await api.addAlbum('collection/1', { album_id: 'album-1' })
        await api.updateAlbum(
            'collection/1',
            'membership/1',
            { notes: null },
        )
        await api.removeAlbum('collection/1', 'membership/1')

        expect(apiClient.getJson).toHaveBeenCalledWith(
            '/collections/collection%2F1/albums?skip=2&take=4',
            undefined,
        )
        expect(apiClient.requestJson).toHaveBeenNthCalledWith(
            1,
            '/collections/collection%2F1/albums',
            { method: 'POST', body: { album_id: 'album-1' } },
        )
        expect(apiClient.requestJson).toHaveBeenNthCalledWith(
            2,
            '/collections/collection%2F1/albums/membership%2F1',
            { method: 'PATCH', body: { notes: null } },
        )
        expect(apiClient.request).toHaveBeenCalledWith(
            '/collections/collection%2F1/albums/membership%2F1',
            { method: 'DELETE' },
        )
    })
})
