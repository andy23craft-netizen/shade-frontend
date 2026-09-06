import type { AlbumCreate, AlbumRead, AlbumTrackWrite, MediaFormat } from '../../api/apiTypes'

export interface AlbumFormValues { title: string; artistIds: string[]; genreIds: string[]; mediaFormat: MediaFormat; shelf: string; barcode: string; label: string; releaseDate: string; notes: string; tracks: AlbumTrackWrite[]; discogsReleaseId?: string | null; musicbrainzReleaseId?: string | null }

export function buildAlbumFormPayload(values: AlbumFormValues, existing?: AlbumRead): AlbumCreate {
    const optional = (value: string, previous?: string | null) => value.trim() ? value.trim() : existing && previous ? null : undefined
    return {
        title: values.title.trim(),
        artist_ids: values.artistIds,
        is_played: existing?.is_played ?? false,
        status: existing?.status ?? 'available',
        ...(values.genreIds.length || existing?.genres.length ? { genre_ids: values.genreIds } : {}),
        media_format: values.mediaFormat,
        ...(values.shelf ? { shelf_name: values.shelf } : existing?.shelf_name ? { shelf_name: null } : {}),
        ...(optional(values.barcode, existing?.barcode) !== undefined ? { barcode: optional(values.barcode, existing?.barcode) } : {}),
        ...(optional(values.label, existing?.label) !== undefined ? { label: optional(values.label, existing?.label) } : {}),
        ...(optional(values.releaseDate, existing?.release_date) !== undefined ? { release_date: optional(values.releaseDate, existing?.release_date) } : {}),
        ...(optional(values.notes, existing?.notes) !== undefined ? { notes: optional(values.notes, existing?.notes) } : {}),
        ...(values.discogsReleaseId ? { discogs_release_id: values.discogsReleaseId } : {}),
        ...(values.musicbrainzReleaseId ? { musicbrainz_release_id: values.musicbrainzReleaseId } : {}),
        ...(values.tracks.length || existing?.tracks.length ? { tracks: values.tracks } : {}),
    }
}
