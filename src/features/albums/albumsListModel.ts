export type AlbumSortBy = 'artist' | 'title' | 'release_date' | 'creation_date'
export type AlbumSortOrder = 'asc' | 'desc'
export interface AlbumListFilters { search?: string; barcode?: string; genreIds: string[]; placementState?: 'shelved' | 'unshelved'; sortBy: AlbumSortBy; sortOrder: AlbumSortOrder }

const SORTS: readonly AlbumSortBy[] = ['artist', 'title', 'release_date', 'creation_date']
const text = (value: string | null) => value?.trim() || undefined

export function parseAlbumListParams(params: URLSearchParams): AlbumListFilters {
    const sort = params.get('sortBy')
    return {
        search: text(params.get('search')),
        barcode: text(params.get('barcode')),
        genreIds: [...new Set(params.getAll('genre_id').filter((value) => value.trim() !== ''))],
        placementState: params.get('placement_state') === 'unshelved' ? 'unshelved' : undefined,
        sortBy: SORTS.includes(sort as AlbumSortBy) ? sort as AlbumSortBy : 'artist',
        sortOrder: params.get('sortOrder') === 'desc' ? 'desc' : 'asc',
    }
}

export function updateAlbumListParams(current: URLSearchParams, updates: Partial<AlbumListFilters>): URLSearchParams {
    const next = new URLSearchParams(current)
    const names: Array<[keyof AlbumListFilters, string]> = [['search', 'search'], ['barcode', 'barcode'], ['placementState', 'placement_state']]
    for (const [property, parameter] of names) if (property in updates) { const value = updates[property]; if (typeof value === 'string' && value.trim()) next.set(parameter, value.trim()); else next.delete(parameter) }
    if ('genreIds' in updates) { next.delete('genre_id'); for (const genreId of [...new Set(updates.genreIds ?? [])]) if (genreId.trim()) next.append('genre_id', genreId) }
    if ('sortBy' in updates) {
        if (updates.sortBy === 'artist') next.delete('sortBy')
        else next.set('sortBy', updates.sortBy!)
    }
    if ('sortOrder' in updates) {
        if (updates.sortOrder === 'asc') next.delete('sortOrder')
        else next.set('sortOrder', updates.sortOrder!)
    }
    return next
}

export const flattenAlbumPages = <T>(pages: Array<{ items: T[] }> | undefined): T[] => pages?.flatMap(page => page.items) ?? []
