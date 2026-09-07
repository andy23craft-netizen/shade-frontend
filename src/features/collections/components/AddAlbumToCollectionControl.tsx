import { useState, type FormEvent } from 'react'
import { Alert, Button, Field } from '../../../components'
import { useAddCollectionAlbum, useCollections } from '../../../api/collectionsQueries'
import { collectionsForMedia } from '../collectionMedia'

export function AddAlbumToCollectionControl({ albumId, albumTitle }: { albumId: string; albumTitle: string }) {
    const collections = useCollections()
    const add = useAddCollectionAlbum()
    const [collectionId, setCollectionId] = useState('')
    const [notes, setNotes] = useState('')
    const [message, setMessage] = useState<{ variant: 'success' | 'error'; text: string } | null>(null)
    const submit = (event: FormEvent) => { event.preventDefault(); if (!collectionId) return; setMessage(null); add.mutate({ collectionId, album: { album_id: albumId, ...(notes.trim() ? { notes: notes.trim() } : {}) } }, { onSuccess: () => { setNotes(''); setMessage({ variant: 'success', text: `${albumTitle} added to the collection.` }) }, onError: (error) => setMessage({ variant: 'error', text: error instanceof Error ? error.message : 'Unable to add the album to the collection.' }) }) }
    const eligibleCollections = collectionsForMedia(
        collections.data?.items ?? [],
        'album',
    )
    return <form className="add-album-to-collection" onSubmit={submit}>{message ? <Alert variant={message.variant}>{message.text}</Alert> : null}<Field label="Collection"><select value={collectionId} onChange={(event) => setCollectionId(event.target.value)} disabled={collections.isPending || add.isPending}><option value="">Choose a collection</option>{eligibleCollections.map((collection) => <option key={collection.collection_id} value={collection.collection_id}>{collection.name}</option>)}</select></Field><Field label="Collection description"><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field><Button type="submit" disabled={!collectionId || add.isPending}>{add.isPending ? 'Adding…' : 'Add to Collection'}</Button></form>
}
