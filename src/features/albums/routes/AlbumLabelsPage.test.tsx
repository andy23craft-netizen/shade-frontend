import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAlbumsByIds, useInfiniteAlbums } from '../../../api/albumsQueries'
import type { AlbumRead } from '../../../api/apiTypes'
import { AlbumLabelsPage } from './AlbumLabelsPage'

vi.mock('../../../api/albumsQueries', () => ({
    useAlbumsByIds: vi.fn(),
    useInfiniteAlbums: vi.fn(),
}))

const { getRawData, QRCodeStyling } = vi.hoisted(() => {
    const rawData = vi.fn()
    function QRCodeStylingMock() {
        return { getRawData: rawData }
    }

    return {
        getRawData: rawData,
        QRCodeStyling: vi.fn(QRCodeStylingMock),
    }
})

vi.mock('qr-code-styling', () => ({ default: QRCodeStyling }))

const album = {
    album_id: 'album-label-id',
    title: 'Album for Labels',
} as AlbumRead

const mockUseAlbumsByIds = vi.mocked(useAlbumsByIds)
const mockUseInfiniteAlbums = vi.mocked(useInfiniteAlbums)

describe('AlbumLabelsPage', () => {
    beforeEach(() => {
        QRCodeStyling.mockClear()
        getRawData.mockClear()
        getRawData.mockResolvedValue(new Blob(['qr']))
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn(() => 'blob:album-label'),
            revokeObjectURL: vi.fn(),
        })
        mockUseInfiniteAlbums.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
            hasNextPage: false,
            isFetchingNextPage: false,
            fetchNextPage: vi.fn(),
        } as unknown as ReturnType<typeof useInfiniteAlbums>)
    })

    it('renders a selected album with its own QR payload and the shared label styling', async () => {
        mockUseAlbumsByIds.mockReturnValue([
            { data: album, isPending: false, isError: false },
        ] as ReturnType<typeof useAlbumsByIds>)

        render(
            <MemoryRouter initialEntries={[
                '/albums/labels?album_id=album-label-id',
            ]}>
                <AlbumLabelsPage />
            </MemoryRouter>,
        )

        await waitFor(() => expect(QRCodeStyling).toHaveBeenCalled())

        expect(QRCodeStyling).toHaveBeenCalledWith(expect.objectContaining({
            data: 'shade:v1:album:album-label-id',
            image: '/favicon-shade.png',
            dotsOptions: expect.objectContaining({ type: 'extra-rounded' }),
        }))
        expect(await screen.findByAltText('Shade label for Album for Labels'))
            .toHaveAttribute('src', 'blob:album-label')
        expect(screen.getByText('Shade Library')).toBeInTheDocument()
    })
})
