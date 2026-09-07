import type {
    CollectionRead,
} from '../../api/apiTypes'

type CollectionMediaType = 'book' | 'album'

export function collectionAcceptsMedia(
    collection: CollectionRead,
    mediaType: CollectionMediaType,
): boolean {
    return collection.media_type == null ||
        collection.media_type === mediaType
}

export function collectionsForMedia(
    collections: readonly CollectionRead[],
    mediaType: CollectionMediaType,
): CollectionRead[] {
    return collections.filter((collection) =>
        collectionAcceptsMedia(collection, mediaType),
    )
}
