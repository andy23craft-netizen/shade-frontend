import type { AlbumRead, ArtistRead } from '../../api/apiTypes'
export const formatArtist = (artist: Pick<ArtistRead, 'first_name' | 'surname'>) => [artist.first_name, artist.surname].filter(Boolean).join(' ')
export const formatAlbumArtists = (album: Pick<AlbumRead, 'artists'>) => album.artists.map(formatArtist).join(', ') || 'Unknown artist'
export const displayMediaFormat = (value: string) => value === 'cd' ? 'CD' : value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
