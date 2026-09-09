import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AlbumRead } from '../../../api/apiTypes'

const mockAlbums = vi.fn()
const mockWork = vi.fn()
const mockMerge = vi.fn()
const mockSplit = vi.fn()

vi.mock('../../../api/albumsQueries', () => ({
    useAlbums: () => mockAlbums(),
}))

vi.mock('../../../api/worksQueries', () => ({
    useWork: () => mockWork(),
    useMergeWorks: () => mockMerge(),
    useSplitWork: () => mockSplit(),
}))

import { AlbumWorkCorrection } from './AlbumWorkCorrection'

const album = {
    album_id: 'album-1',
    work_id: 'work-1',
    title: 'Blue',
    barcode: '12345',
    shelf_name: 'albums',
    artists: [{ first_name: null, surname: 'Joni Mitchell' }],
} as AlbumRead

describe('AlbumWorkCorrection', () => {
    it('offers only a matching album from a different Work', () => {
        mockAlbums.mockReturnValue({
            isPending: false,
            data: {
                items: [
                    album,
                    {
                        ...album,
                        album_id: 'album-2',
                        work_id: 'work-2',
                        shelf_name: 'crate-b',
                    },
                    {
                        ...album,
                        album_id: 'album-3',
                        work_id: 'work-3',
                        barcode: 'different',
                        title: 'Different album',
                    },
                ],
            },
        })
        mockWork.mockReturnValue({ data: { item_ids: ['album-1'] } })
        mockMerge.mockReturnValue({ isPending: false, error: null })
        mockSplit.mockReturnValue({ isPending: false, error: null })

        render(<AlbumWorkCorrection album={album} />)

        fireEvent.click(screen.getByRole('button', { name: 'Check possible duplicates' }))

        expect(screen.getByRole('option', { name: /Blue.*crate-b/i })).toBeInTheDocument()
        expect(screen.queryByRole('option', { name: /Different album/i })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Group as Same Work' })).toBeDisabled()
    })
})
