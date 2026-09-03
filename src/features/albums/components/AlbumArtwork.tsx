import { useEffect, useMemo } from 'react'
import { useAlbumArtwork } from '../../../api/albumsQueries'
export function AlbumArtwork({ albumId, title, present = true }: { albumId: string; title: string; present?: boolean }) {
    const query = useAlbumArtwork(albumId, present)
    const url = useMemo(() => query.data ? URL.createObjectURL(query.data) : null, [query.data])
    useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
    return url ? <img className="album-artwork" src={url} alt={`Artwork for ${title}`} /> : <div className="album-artwork album-artwork--placeholder" aria-label={`No artwork for ${title}`}><span aria-hidden="true">♪</span></div>
}
