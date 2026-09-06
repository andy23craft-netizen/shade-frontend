import type { MediaFormat } from '../../api/apiTypes'

export type AlbumSortBy = 'artist' | 'title' | 'release_date' | 'creation_date'
export type AlbumSortOrder = 'asc' | 'desc'
export interface AlbumListFilters { artist?: string; title?: string; barcode?: string; mediaFormat?: MediaFormat; placementState?: 'shelved' | 'unshelved'; includeDeleted: boolean; sortBy: AlbumSortBy; sortOrder: AlbumSortOrder }

const FORMATS: readonly MediaFormat[] = ['vinyl', 'cd', 'cassette', 'other', 'unknown']
const SORTS: readonly AlbumSortBy[] = ['artist', 'title', 'release_date', 'creation_date']
const text = (value: string | null) => value?.trim() || undefined

export function parseAlbumListParams(params: URLSearchParams): AlbumListFilters {
    const media = params.get('media_format')
    const sort = params.get('sortBy')
    return {
        artist: text(params.get('artist')),
        title: text(params.get('title')),
        barcode: text(params.get('barcode')),
        mediaFormat: FORMATS.includes(media as MediaFormat) ? media as MediaFormat : undefined,
        placementState: params.get('placement_state') === 'unshelved' ? 'unshelved' : undefined,
        includeDeleted: params.get('include_deleted') === 'true',
        sortBy: SORTS.includes(sort as AlbumSortBy) ? sort as AlbumSortBy : 'artist',
        sortOrder: params.get('sortOrder') === 'desc' ? 'desc' : 'asc',
    }
}

export function updateAlbumListParams(current: URLSearchParams, updates: Partial<AlbumListFilters>): URLSearchParams {
    const next = new URLSearchParams(current)
    const names: Array<[keyof AlbumListFilters, string]> = [['artist', 'artist'], ['title', 'title'], ['barcode', 'barcode'], ['mediaFormat', 'media_format'], ['placementState', 'placement_state']]
    for (const [property, parameter] of names) if (property in updates) { const value = updates[property]; if (typeof value === 'string' && value.trim()) next.set(parameter, value.trim()); else next.delete(parameter) }
    if ('includeDeleted' in updates) {
        if (updates.includeDeleted) next.set('include_deleted', 'true')
        else next.delete('include_deleted')
    }
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
