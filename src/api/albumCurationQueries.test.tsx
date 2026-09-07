import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import {
    renderHook,
} from '@testing-library/react'
import type {
    ReactNode,
} from 'react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    useAddCollectionAlbum,
    useRemoveCollectionAlbum,
} from './collectionsQueries'
import {
    useMoveWishlistAlbumToShelf,
} from './wishlistsQueries'
import {
    queryKeys,
} from './queryKeys'

const addCollectionAlbum = vi.fn()
const removeCollectionAlbum = vi.fn()
const moveAlbumToShelf = vi.fn()

vi.mock('./collectionsApi', () => ({
    createCollectionsApi: () => ({
        addAlbum: addCollectionAlbum,
        removeAlbum: removeCollectionAlbum,
    }),
}))

vi.mock('./wishlistsApi', () => ({
    createWishlistsApi: () => ({
        moveAlbumToShelf,
    }),
}))

vi.mock('../features/connection/useConnection', () => ({
    useConnection: () => ({ apiClient: {} }),
}))

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            mutations: { retry: false },
            queries: { retry: false },
        },
    })
    function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
    return { queryClient, Wrapper }
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('album curation cache updates', () => {
    it('refreshes membership and collection media type after add and remove', async () => {
        addCollectionAlbum.mockResolvedValue({})
        removeCollectionAlbum.mockResolvedValue(undefined)
        const { queryClient, Wrapper } = createWrapper()
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
        const add = renderHook(() => useAddCollectionAlbum(), { wrapper: Wrapper })
        const remove = renderHook(() => useRemoveCollectionAlbum(), { wrapper: Wrapper })

        await add.result.current.mutateAsync({
            collectionId: 'collection-1',
            album: { album_id: 'album-1' },
        })
        await remove.result.current.mutateAsync({
            collectionId: 'collection-1',
            collectionAlbumId: 'membership-1',
        })

        expect(invalidate).toHaveBeenCalledWith({
            queryKey: queryKeys.collections.albums('collection-1'),
        })
        expect(invalidate).toHaveBeenCalledWith({
            queryKey: queryKeys.collections.list(),
        })
    })

    it('hydrates album detail and invalidates every atomic-move consumer', async () => {
        const album = { album_id: 'album-1', title: 'Blue' }
        moveAlbumToShelf.mockResolvedValue({
            album_id: 'album-1',
            album,
        })
        const { queryClient, Wrapper } = createWrapper()
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
        const hook = renderHook(
            () => useMoveWishlistAlbumToShelf(),
            { wrapper: Wrapper },
        )

        await hook.result.current.mutateAsync({
            wishlistId: 'wishlist-1',
            wishlistItemId: 'item-1',
            albumId: 'album-1',
            shelfName: 'music',
        })

        expect(moveAlbumToShelf).toHaveBeenCalledWith(
            'wishlist-1',
            'item-1',
            { shelf_name: 'music' },
        )
        expect(queryClient.getQueryData(
            queryKeys.albums.detail('album-1'),
        )).toEqual(album)
        for (const queryKey of [
            queryKeys.wishlists.items('wishlist-1'),
            queryKeys.albums.all,
            queryKeys.shelves.all,
            queryKeys.collections.all,
            queryKeys.dashboard.all,
        ]) {
            expect(invalidate).toHaveBeenCalledWith({ queryKey })
        }
    })
})
