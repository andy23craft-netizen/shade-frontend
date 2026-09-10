import { useState } from 'react'

import {
    Alert,
    AppLink,
    Button,
    ConfirmationDialog,
    Field,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import type { CollectionAlbumRead } from '../../../api/apiTypes'
import {
    useAddCollectionAlbum,
    useCollectionAlbums,
    useRemoveCollectionAlbum,
    useUpdateCollectionAlbum,
} from '../../../api/collectionsQueries'
import { useAlbum, useAlbums } from '../../../api/albumsQueries'
import { AlbumArtwork } from '../../albums/components/AlbumArtwork'
import { displayMediaFormat, formatAlbumArtists } from '../../albums/albumDisplay'
import { MembershipNotesEditor } from '../../shared/MembershipNotesEditor'

function CollectionAlbumRow({ membership, total }: { membership: CollectionAlbumRead; total: number }) {
    const album = useAlbum(membership.album_id)
    const update = useUpdateCollectionAlbum()
    const remove = useRemoveCollectionAlbum()
    const [removeOpen, setRemoveOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function move(orderNum: number) {
        setError(null)
        update.mutate(
            {
                collectionId: membership.collection_id,
                collectionAlbumId: membership.collection_album_id,
                update: { order_num: orderNum },
            },
            { onError: (cause) => setError(cause instanceof Error ? cause.message : 'Unable to reorder the album.') },
        )
    }

    const artists = (membership.album_artists ?? [])
        .map((artist) => [artist.first_name, artist.surname].filter(Boolean).join(' '))
        .join(', ') || 'Unknown artist'

    return (
        <li className="collection-membership collection-membership--album" data-membership-id={membership.collection_album_id}>
            <div className="collection-membership__book">
                <span className="collection-membership__position" aria-label={`Position ${membership.order_num}`}>{membership.order_num}</span>
                <div className="collection-membership__cover">
                    <AlbumArtwork albumId={membership.album_id} title={membership.album_title} present={album.data?.artwork_present ?? false} />
                </div>
                <div className="collection-membership__identity">
                    <strong><AppLink to={`/albums/${encodeURIComponent(membership.album_id)}`}>{membership.album_title}</AppLink></strong>
                    <p>{artists}</p>
                    {album.data ? <p>{displayMediaFormat(album.data.media_format)}</p> : null}
                </div>
            </div>
            <dl className="collection-membership__details">
                <div><dt>Location</dt><dd>{membership.on_wishlist ? 'Wishlist' : membership.shelf_name ?? 'Unshelved'}</dd></div>
                {membership.notes ? <div><dt>Notes</dt><dd>{membership.notes}</dd></div> : null}
            </dl>
            {album.isError ? <Alert variant="warning">Some album metadata could not be loaded.</Alert> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
            <MembershipNotesEditor
                label="Collection description"
                notes={membership.notes}
                onSave={(notes) => update.mutateAsync({
                    collectionId: membership.collection_id,
                    collectionAlbumId: membership.collection_album_id,
                    update: { notes },
                })}
            />
            <div className="collection-membership__actions">
                <Button type="button" variant="secondary" disabled={membership.order_num === 1 || update.isPending} onClick={() => move(membership.order_num - 1)}>Move Up</Button>
                <Button type="button" variant="secondary" disabled={membership.order_num === total || update.isPending} onClick={() => move(membership.order_num + 1)}>Move Down</Button>
                <Button type="button" variant="danger" disabled={remove.isPending} onClick={() => setRemoveOpen(true)}>Remove</Button>
            </div>
            <ConfirmationDialog
                open={removeOpen}
                title="Remove album from collection?"
                confirmLabel={remove.isPending ? 'Removing…' : 'Remove Album'}
                cancelLabel="Cancel"
                confirmVariant="danger"
                onCancel={() => { if (!remove.isPending) setRemoveOpen(false) }}
                onConfirm={() => remove.mutate(
                    { collectionId: membership.collection_id, collectionAlbumId: membership.collection_album_id },
                    {
                        onSuccess: () => setRemoveOpen(false),
                        onError: (cause) => {
                            setRemoveOpen(false)
                            setError(cause instanceof Error ? cause.message : 'Unable to remove the album.')
                        },
                    },
                )}
            >
                Remove <strong>{membership.album_title}</strong>? The catalog album remains in the library.
            </ConfirmationDialog>
        </li>
    )
}

export function CollectionAlbums({ collectionId, enabled }: { collectionId: string; enabled: boolean }) {
    const query = useCollectionAlbums(collectionId, { enabled })
    const add = useAddCollectionAlbum()
    const [search, setSearch] = useState('')
    const [addError, setAddError] = useState<string | null>(null)
    const albums = useAlbums(
        search.trim() ? { search } : {},
        { enabled: enabled && search.trim().length > 0 },
    )

    if (!enabled) return null

    const ordered = [...(query.data?.items ?? [])].sort((left, right) => left.order_num - right.order_num)

    return (
        <section className="collection-albums" aria-label="Collection albums">
            <div className="wishlist-media-heading"><h3>Albums</h3><span>{query.data?.total ?? 0} {(query.data?.total ?? 0) === 1 ? 'record' : 'records'}</span></div>
            <form className="collection-albums__add" onSubmit={(event) => event.preventDefault()}>
                <Field label="Find owned album"><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></Field>
                {addError ? <Alert variant="error">{addError}</Alert> : null}
                {albums.isPending && search.trim() ? <LoadingState label="Searching albums…" /> : null}
                {albums.isError ? <QueryErrorState title="Unable to search albums" error={albums.error} onRetry={() => void albums.refetch()} /> : null}
                {search.trim() && albums.isSuccess ? (
                    albums.data.items.length ? <ul className="collection-albums__results">{albums.data.items.map((album) => <li key={album.album_id}><span><strong>{album.title}</strong> — {formatAlbumArtists(album)}</span><Button type="button" variant="secondary" disabled={add.isPending} onClick={() => { setAddError(null); add.mutate({ collectionId, album: { album_id: album.album_id } }, { onError: (cause) => setAddError(cause instanceof Error ? cause.message : 'Unable to add the album.') }) }}>Add</Button></li>)}</ul> : <p>No owned albums match that search.</p>
                ) : null}
            </form>
            {query.isPending ? <LoadingState label="Loading collection albums…" /> : null}
            {query.isError ? <QueryErrorState title="Unable to load collection albums" error={query.error} onRetry={() => void query.refetch()} /> : null}
            {query.isSuccess && ordered.length === 0 ? <p>No albums have been added to this collection yet.</p> : null}
            {ordered.length > 0 ? <ol className="collection-memberships" aria-label="Collection album memberships">{ordered.map((membership) => <CollectionAlbumRow key={membership.collection_album_id} membership={membership} total={ordered.length} />)}</ol> : null}
        </section>
    )
}
