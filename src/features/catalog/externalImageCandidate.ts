/** The backend deliberately keeps provider records opaque. Read only display and
 * hand-off fields; never call Open Library, Discogs, or MusicBrainz from the SPA. */
export type ExternalImageCandidate = Record<string, unknown>

function stringValue(candidate: ExternalImageCandidate, names: readonly string[]): string | null {
    for (const name of names) {
        const value = candidate[name]
        if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return null
}

export function externalCandidateTitle(candidate: ExternalImageCandidate, fallback: string): string {
    return stringValue(candidate, ['title', 'name']) ?? fallback
}

export function externalBookIsbn(candidate: ExternalImageCandidate): string | null {
    return stringValue(candidate, ['isbn13', 'isbn_13', 'isbn'])
}

export function externalAlbumLookup(candidate: ExternalImageCandidate): { kind: 'barcode' | 'discogs'; value: string } | null {
    const barcode = stringValue(candidate, ['barcode', 'upc'])
    if (barcode) return { kind: 'barcode', value: barcode }
    const discogs = stringValue(candidate, ['discogs_release_id', 'discogsReleaseId'])
    return discogs ? { kind: 'discogs', value: discogs } : null
}

export function externalCandidateDetails(candidate: ExternalImageCandidate): string | null {
    return stringValue(candidate, ['authors', 'author', 'artists', 'artist', 'publisher', 'label'])
}
