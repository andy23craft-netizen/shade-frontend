import { useState } from 'react'

import { Alert, AppLink, Button, ConfirmationDialog, LoadingState, QueryErrorState } from '../../../components'
import { useAlbum } from '../../../api/albumsQueries'
import { useShelves } from '../../../api/shelvesQueries'
import { useMoveWishlistAlbumToShelf, useRemoveWishlistAlbum, useUpdateWishlistAlbum, useWishlistItems } from '../../../api/wishlistsQueries'
import type { WishlistItemRead } from '../../../api/apiTypes'
import { isApiError } from '../../../api/apiErrors'
import { displayMediaFormat, formatAlbumArtists } from '../../albums/albumDisplay'
import { AlbumArtwork } from '../../albums/components/AlbumArtwork'
import { displayWishlistBookStatus, displayWishlistPriority, safeHttpUrl } from '../wishlistDisplay'
import { MembershipNotesEditor } from '../../shared/MembershipNotesEditor'

function WishlistAlbumRow({ membership }: { membership: WishlistItemRead }) {
    const albumId = membership.album_id ?? ''
    const album = useAlbum(albumId)
    const removeMembership = useRemoveWishlistAlbum()
    const updateMembership = useUpdateWishlistAlbum()
    const moveMembership = useMoveWishlistAlbumToShelf()
    const shelves = useShelves()
    const [shelfName, setShelfName] = useState('')
    const [confirmRemove, setConfirmRemove] = useState(false)
    const [removeError, setRemoveError] = useState<string | null>(null)

    if (album.isPending) return <li><LoadingState label="Loading album…" /></li>
    if (album.isError) return <li><QueryErrorState title="Unable to load wishlist album" error={album.error} /></li>

    const item = album.data
    const safeUrl = safeHttpUrl(membership.url)

    return (
        <li className="wishlist-membership wishlist-membership--album" data-membership-id={membership.wishlist_item_id}>
            <div className="wishlist-album__identity">
                <AlbumArtwork albumId={albumId} title={item.title} present={item.artwork_present} />
                <div>
                    <p className="wishlist-album__eyebrow">Wishlist record</p>
                    <strong><AppLink to={`/albums/${encodeURIComponent(albumId)}`}>{item.title}</AppLink></strong>
                    <p>{formatAlbumArtists(item)}</p>
                </div>
            </div>
            <dl>
                <div><dt>Format</dt><dd>{displayMediaFormat(item.media_format)}</dd></div>
                <div><dt>Status</dt><dd>{displayWishlistBookStatus(membership.status)}</dd></div>
                <div><dt>Priority</dt><dd>{displayWishlistPriority(membership.priority)}</dd></div>
                {membership.notes ? <div><dt>Notes</dt><dd>{membership.notes}</dd></div> : null}
                {safeUrl ? <div><dt>URL</dt><dd><a href={safeUrl} rel="noreferrer" target="_blank">{safeUrl}</a></dd></div> : null}
            </dl>
            {removeError ? <Alert variant="error">{removeError}</Alert> : null}
            <MembershipNotesEditor label="Wishlist description" notes={membership.notes} onSave={(notes) => updateMembership.mutateAsync({ wishlistId: membership.wishlist_id, wishlistItemId: membership.wishlist_item_id, notes })} />
            <form className="wishlist-album__move" onSubmit={(event) => { event.preventDefault(); if (!shelfName) return; setRemoveError(null); moveMembership.mutate({ wishlistId: membership.wishlist_id, wishlistItemId: membership.wishlist_item_id, albumId, shelfName }, { onError: (error) => setRemoveError(error instanceof Error ? error.message : 'The album could not be moved to the crate.') }) }}>
                <label>Move to crate<select value={shelfName} onChange={(event) => setShelfName(event.target.value)} disabled={shelves.isPending || moveMembership.isPending}><option value="">Choose a crate</option>{(shelves.data ?? []).filter((shelf) => shelf.common_name !== 'removed').map((shelf) => <option key={shelf.shelf_id} value={shelf.common_name}>{shelf.common_name}</option>)}</select></label>
                <Button type="submit" disabled={!shelfName || shelves.isPending || moveMembership.isPending}>{moveMembership.isPending ? 'Moving…' : 'Move to Crate'}</Button>
            </form>
            <Button type="button" variant="danger" disabled={removeMembership.isPending} onClick={() => setConfirmRemove(true)}>
                Remove from Wishlist
            </Button>
            <ConfirmationDialog
                open={confirmRemove}
                title="Remove album from wishlist?"
                confirmLabel={removeMembership.isPending ? 'Removing…' : 'Remove from Wishlist'}
                cancelLabel="Cancel"
                confirmVariant="danger"
                onConfirm={() => {
                    if (removeMembership.isPending) return
                    setRemoveError(null)
                    removeMembership.mutate(
                        { wishlistId: membership.wishlist_id, wishlistItemId: membership.wishlist_item_id },
                        {
                            onSuccess: () => setConfirmRemove(false),
                            onError: (error) => {
                                setConfirmRemove(false)
                                setRemoveError(isApiError(error) ? error.detail ?? error.message : error instanceof Error ? error.message : 'The album could not be removed from the wishlist.')
                            },
                        },
                    )
                }}
                onCancel={() => { if (!removeMembership.isPending) setConfirmRemove(false) }}
            >
                Remove <strong>{item.title}</strong> from this wishlist? The album remains in the catalog.
            </ConfirmationDialog>
        </li>
    )
}

export function WishlistAlbums({ wishlistId, enabled, bookTotal }: { wishlistId: string; enabled: boolean; bookTotal: number }) {
    const query = useWishlistItems(enabled ? wishlistId : '')
    if (!enabled) return null
    if (query.isPending) return <LoadingState label="Loading wishlist albums…" />
    if (query.isError) return <QueryErrorState title="Unable to load wishlist albums" error={query.error} onRetry={() => void query.refetch()} />

    const albums = query.data.items.filter((item) => item.album_id !== null)
    if (albums.length === 0) return bookTotal === 0 ? <p>No books or albums have been added to this wishlist yet.</p> : null

    return (
        <section className="wishlist-albums" aria-labelledby={`wishlist-${wishlistId}-albums`}>
            <div className="wishlist-media-heading">
                <h3 id={`wishlist-${wishlistId}-albums`}>Albums</h3>
                <span>{albums.length} {albums.length === 1 ? 'record' : 'records'}</span>
            </div>
            <ul className="wishlist-memberships wishlist-albums__records" aria-label="Wishlist albums">
                {albums.map((membership) => <WishlistAlbumRow key={membership.wishlist_item_id} membership={membership} />)}
            </ul>
        </section>
    )
}
