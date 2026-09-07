import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GuidedSetupActions } from './GuidedSetupActions'

const mutateAsync = vi.fn()
vi.mock('../../../api/libraryQueries', () => ({
    useCompleteLibrarySetup: () => ({ mutateAsync, isPending: false }),
}))

const values = new Map<string, string>()
Object.defineProperty(window, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
} })

function renderActions(entry: string, media: 'book' | 'album' = 'book', hasUnresolved = false) {
    return render(
        <MemoryRouter initialEntries={[entry]}>
            <Routes>
                <Route path="*" element={<><GuidedSetupActions media={media} hasUnresolved={hasUnresolved} /><span>current route</span></>} />
            </Routes>
        </MemoryRouter>,
    )
}

describe('GuidedSetupActions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        values.clear()
        values.set('shade:andy:shared:guided-setup:v1', JSON.stringify({
            version: 1,
            sessionId: 'setup-a',
            selectedMedia: 'book',
            destinations: { book: { shelfId: 'shelf-1', shelfName: 'west_wall' } },
            nextClientSequence: { book: 1, album: 1 },
        }))
    })

    it('stays out of ordinary bulk intake', () => {
        renderActions('/books/bulk-add')
        expect(screen.queryByRole('button', { name: 'Complete library setup' })).not.toBeInTheDocument()
    })

    it('completes zero-item setup through the dedicated endpoint', async () => {
        mutateAsync.mockResolvedValue({ state: 'complete' })
        renderActions('/books/bulk-add?setup=1')
        fireEvent.click(screen.getByRole('button', { name: 'Complete library setup' }))
        await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ initial_media: 'book', shelf_ids: ['shelf-1'] }))
    })

    it('preserves unresolved work unless completion is confirmed', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        renderActions('/albums/bulk-add?setup=1', 'album', true)
        fireEvent.click(screen.getByRole('button', { name: 'Complete library setup' }))
        expect(mutateAsync).not.toHaveBeenCalled()
    })

    it('keeps completion retryable after a request failure', async () => {
        mutateAsync.mockRejectedValue(new Error('Connection interrupted'))
        renderActions('/books/bulk-add?setup=1')
        fireEvent.click(screen.getByRole('button', { name: 'Complete library setup' }))
        expect(await screen.findByRole('alert')).toHaveTextContent('Connection interrupted')
        expect(screen.getByRole('button', { name: 'Complete library setup' })).toBeEnabled()
    })
})
