import { useState } from 'react'

import { Alert, AppLink, Button, Field, LoadingState, QueryErrorState } from '../../../components'
import { useAlbum } from '../../../api/albumsQueries'
import { useShelves } from '../../../api/shelvesQueries'
import {
    MoveWishlistAlbumToShelfError,
    useMoveWishlistAlbumToShelf,
    useWishlistItems,
} from '../../../api/wishlistsQueries'
import type { WishlistItemRead } from '../../../api/apiTypes'
import { formatAlbumArtists } from '../../albums/albumDisplay'
import { AlbumArtwork } from '../../albums/components/AlbumArtwork'

function WishlistAlbumRow({ membership }: { membership: WishlistItemRead }) {
    const albumId = membership.album_id ?? ''
    const album = useAlbum(albumId)
    const shelves = useShelves()
    const move = useMoveWishlistAlbumToShelf()
    const [shelfName, setShelfName] = useState('')
    const [membershipRemoved, setMembershipRemoved] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (album.isPending) return <li><LoadingState label="Loading album…" /></li>
    if (album.isError) return <li><QueryErrorState title="Unable to load wishlist album" error={album.error} /></li>

    const item = album.data

    return (
        <li className="wishlist-membership" data-membership-id={membership.wishlist_item_id}>
            <div>
                <AlbumArtwork albumId={albumId} title={item.title} present={item.artwork_present} />
                <strong><AppLink to={`/albums/${encodeURIComponent(albumId)}`}>{item.title}</AppLink></strong>
                <p>{formatAlbumArtists(item)}</p>
            </div>

            {membership.notes ? <p>{membership.notes}</p> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}

            <form onSubmit={(event) => {
                event.preventDefault()
                if (!shelfName || move.isPending) return
                setError(null)
                move.mutate({
                    wishlistId: membership.wishlist_id,
                    wishlistItemId: membership.wishlist_item_id,
                    albumId,
                    shelfName,
                    membershipRemoved,
                }, {
                    onError: (cause) => {
                        if (cause instanceof MoveWishlistAlbumToShelfError) {
                            setMembershipRemoved(cause.membershipRemoved)
                            setError(cause.membershipRemoved
                                ? 'The album left the wishlist, but could not be placed. Choose a shelf and retry.'
                                : cause.message)
                        } else {
                            setError(cause instanceof Error ? cause.message : 'Unable to move the album to a shelf.')
                        }
                    },
                })
            }}>
                <Field label="Move to shelf">
                    <select value={shelfName} disabled={shelves.isPending || move.isPending} onChange={(event) => setShelfName(event.target.value)}>
                        <option value="">Choose a shelf</option>
                        {(shelves.data ?? []).filter((shelf) => shelf.common_name !== 'removed').map((shelf) => (
                            <option key={shelf.shelf_id} value={shelf.common_name}>{shelf.common_name}</option>
                        ))}
                    </select>
                </Field>
                <Button type="submit" disabled={!shelfName || shelves.isPending || move.isPending}>
                    {move.isPending ? 'Moving…' : membershipRemoved ? 'Retry placement' : 'Move to Shelf'}
                </Button>
            </form>
        </li>
    )
}

export function WishlistAlbums({ wishlistId, enabled }: { wishlistId: string; enabled: boolean }) {
    const query = useWishlistItems(enabled ? wishlistId : '')
    if (!enabled) return null
    if (query.isPending) return <LoadingState label="Loading wishlist albums…" />
    if (query.isError) return <QueryErrorState title="Unable to load wishlist albums" error={query.error} onRetry={() => void query.refetch()} />

    const albums = query.data.items.filter((item) => item.album_id !== null)
    if (albums.length === 0) return null

    return (
        <section>
            <h3>Albums</h3>
            <ul className="wishlist-memberships" aria-label="Wishlist albums">
                {albums.map((membership) => <WishlistAlbumRow key={membership.wishlist_item_id} membership={membership} />)}
            </ul>
        </section>
    )
}
