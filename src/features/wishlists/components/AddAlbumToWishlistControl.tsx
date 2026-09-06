import { useState, type FormEvent } from 'react'

import { Alert, Button, Field, ModalDialog, QueryErrorState } from '../../../components'
import { isApiError } from '../../../api/apiErrors'
import { useAddWishlistAlbum, useRemoveWishlistAlbum, useWishlistItems, useWishlists } from '../../../api/wishlistsQueries'
import type { WishlistRead } from '../../../api/apiTypes'

function WishlistMembershipChoice({ wishlist, albumId, selected, onSelect }: { wishlist: WishlistRead; albumId: string; selected: boolean; onSelect: () => void }) {
    const items = useWishlistItems(wishlist.wishlist_id); const remove = useRemoveWishlistAlbum()
    const membership = items.data?.items.find((item) => item.album_id === albumId)
    if (membership) return <div className="album-wishlist-control__membership"><span>{wishlist.name} — already added</span><Button type="button" variant="danger" disabled={remove.isPending} onClick={() => remove.mutate({ wishlistId: wishlist.wishlist_id, wishlistItemId: membership.wishlist_item_id })}>{remove.isPending ? 'Removing…' : 'Remove'}</Button></div>
    return <label><input type="radio" name={`wishlist-${albumId}`} checked={selected} onChange={onSelect} /> {wishlist.name}</label>
}

export function AddAlbumToWishlistControl({ albumId, albumTitle, compact = false }: { albumId: string; albumTitle: string; compact?: boolean }) {
    const wishlists = useWishlists()
    const addAlbum = useAddWishlistAlbum()
    const [open, setOpen] = useState(false)
    const [wishlistId, setWishlistId] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!wishlistId || addAlbum.isPending) return
        setError(null)
        setMessage(null)
        addAlbum.mutate(
            { wishlistId, album: { album_id: albumId, status: 'wanted' } },
            {
                onSuccess: () => {
                    const name = wishlists.data?.items.find((wishlist) => wishlist.wishlist_id === wishlistId)?.name
                    setMessage(name ? `Added to ${name}.` : 'Added to wishlist.')
                    setOpen(false)
                    setWishlistId('')
                },
                onError: (cause) => setError(
                    isApiError(cause)
                        ? cause.detail ?? cause.message
                        : cause instanceof Error
                            ? cause.message
                            : 'The album could not be added to the wishlist.',
                ),
            },
        )
    }

    return (
        <div className={compact ? 'album-wishlist-control album-wishlist-control--compact' : 'album-wishlist-control'}>
            <Button type="button" variant="secondary" onClick={() => { setError(null); setOpen(true) }}>
                Add to Wishlist
            </Button>
            {message ? <Alert variant="success">{message}</Alert> : null}
            <ModalDialog open={open} title={`Add ${albumTitle} to a wishlist`} onClose={() => { if (!addAlbum.isPending) setOpen(false) }}>
                {wishlists.isError ? <QueryErrorState title="Unable to load wishlists" error={wishlists.error} onRetry={() => void wishlists.refetch()} /> : null}
                {!wishlists.isError && wishlists.isSuccess && wishlists.data.items.length === 0 ? (
                    <Alert variant="info">Create a wishlist on the Wishlists page first.</Alert>
                ) : null}
                <form className="album-wishlist-control__form" onSubmit={submit}>
                    {error ? <Alert variant="error">{error}</Alert> : null}
                    <Field label="Wishlist"><div className="album-wishlist-control__choices">{(wishlists.data?.items ?? []).map((wishlist) => <WishlistMembershipChoice key={wishlist.wishlist_id} wishlist={wishlist} albumId={albumId} selected={wishlistId === wishlist.wishlist_id} onSelect={() => setWishlistId(wishlist.wishlist_id)} />)}</div></Field>
                    <Button type="submit" disabled={!wishlistId || wishlists.isPending || addAlbum.isPending}>
                        {addAlbum.isPending ? 'Adding…' : 'Add Album'}
                    </Button>
                </form>
            </ModalDialog>
        </div>
    )
}
