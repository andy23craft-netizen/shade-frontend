import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

const mockDashboard = vi.fn()
const mockBreakdowns = vi.fn()
const mockAlbums = vi.fn()

vi.mock('../../../api/dashboardQueries', () => ({
    useDashboard: () => mockDashboard(),
    useDashboardBreakdowns: () => mockBreakdowns(),
}))

vi.mock('../../../api/albumsQueries', () => ({
    useAlbums: () => mockAlbums(),
}))

vi.mock('../../albums/components/AlbumArtwork', () => ({
    AlbumArtwork: ({ title }: { title: string }) => <div>Artwork for {title}</div>,
}))

import { ListeningDashboardPage } from './ListeningDashboardPage'

const query = (data: unknown) => ({
    data,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
})

describe('ListeningDashboardPage', () => {
    it('renders five random shelf choices and puts the selected album on the deck', () => {
        mockDashboard.mockReturnValue(query({
            total_albums: 5,
            albums_checked_out: 1,
            albums_recently_added: 2,
            listening: { albums_played: 2, albums_unplayed: 3, average_rating: 4 },
            album_borrowing: { active_loans: 1, lifetime_loans: 4, average_loan_days: 3 },
        }))
        mockBreakdowns.mockReturnValue(query({
            albums_by_media_format: [{ key: 'vinyl', count: 5 }],
            albums_by_shelf: [{ key: 'records', count: 5 }],
        }))
        mockAlbums.mockReturnValue(query({
            items: Array.from({ length: 5 }, (_, index) => ({
                album_id: `album-${index + 1}`,
                title: `Album ${index + 1}`,
                artists: [{ first_name: null, surname: `Artist ${index + 1}` }],
                artwork_present: true,
                media_format: 'vinyl',
                status: 'available',
                shelf_name: 'records',
            })),
            total: 5,
        }))

        render(<MemoryRouter><ListeningDashboardPage /></MemoryRouter>)

        expect(screen.getAllByRole('button', { name: /Album \d/ })).toHaveLength(5)
        fireEvent.click(screen.getByRole('button', { name: /Album 2/ }))
        expect(screen.getByRole('heading', { name: 'Album 2' })).toBeVisible()
        expect(document.querySelector('.listening-dashboard__now-playing-card')).toBeInTheDocument()
        expect(screen.getByText('Now Playing')).toBeVisible()
        expect(screen.getByText('A dashboard selection only; it does not start playback or change listening history.')).toBeVisible()
    })
})
