import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AlbumArtwork } from './AlbumArtwork'

const artwork = new Blob(['private-artwork'], { type: 'image/webp' })
vi.mock('../../../api/albumsQueries', () => ({ useAlbumArtwork: () => ({ data: artwork }) }))

describe('AlbumArtwork', () => {
    afterEach(() => vi.restoreAllMocks())
    it('revokes its object URL when the host application unmounts', () => {
        const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:tenant-artwork')
        const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
        const view = render(<AlbumArtwork albumId="album-1" title="Private Album" />)
        expect(create).toHaveBeenCalledWith(artwork)
        view.unmount()
        expect(revoke).toHaveBeenCalledWith('blob:tenant-artwork')
    })
})
