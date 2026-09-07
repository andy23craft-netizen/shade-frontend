import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LibrarySetupPage } from './LibrarySetupPage'

const refetch = vi.fn()
const shelvesRefetch = vi.fn()
const createShelf = vi.fn()
const shelvesState = {
    data: [{ shelf_id: 'shelf-1', common_name: 'front_room', created_date: '', updated_date: '' }],
    isPending: false,
    isError: false,
    error: null as unknown,
    refetch: shelvesRefetch,
}
const createShelfState = { mutateAsync: createShelf, isPending: false }
const storedValues = new Map<string, string>()
const localStorage = {
    getItem: (key: string) => storedValues.get(key) ?? null,
    setItem: (key: string, value: string) => storedValues.set(key, value),
    removeItem: (key: string) => storedValues.delete(key),
    clear: () => storedValues.clear(),
    key: (index: number) => [...storedValues.keys()][index] ?? null,
    get length() { return storedValues.size },
}
Object.defineProperty(window, 'localStorage', { configurable: true, value: localStorage })
const setupState = {
    data: undefined as undefined | {
        state: 'required' | 'in_progress' | 'complete' | 'failed'
        has_catalog_items: boolean
        system_shelves_ready: boolean
        supported_media: Array<'book' | 'album'>
        failure_code: string | null
    },
    isPending: false,
    isError: false,
    error: null as unknown,
    refetch,
}

vi.mock('../../../api/libraryQueries', () => ({
    useLibrarySetup: () => setupState,
}))
vi.mock('../../../api/shelvesQueries', () => ({
    useShelves: () => shelvesState,
    useCreateShelf: () => createShelfState,
}))

function renderPage() {
    return render(<MemoryRouter><LibrarySetupPage /></MemoryRouter>)
}

describe('LibrarySetupPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        setupState.data = undefined
        setupState.isPending = false
        setupState.isError = false
        setupState.error = null
        storedValues.clear()
    })

    it('keeps loading distinct from an uninitialized library', () => {
        setupState.isPending = true
        renderPage()
        expect(screen.getByText('Checking library setup…')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Books/ })).not.toBeInTheDocument()
    })

    it('offers retry when setup state cannot be loaded', () => {
        setupState.isError = true
        setupState.error = new Error('offline')
        renderPage()
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
        expect(refetch).toHaveBeenCalledOnce()
    })

    it('does not disguise a durable failed state as first-run setup', () => {
        setupState.data = { state: 'failed', has_catalog_items: false, system_shelves_ready: false, supported_media: ['book', 'album'], failure_code: 'bootstrap_failed' }
        renderPage()
        expect(screen.getByRole('alert')).toHaveTextContent(/cannot continue/i)
        expect(screen.queryByRole('button', { name: /Books/ })).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Check again' }))
        expect(refetch).toHaveBeenCalledOnce()
    })

    it.each(['required', 'in_progress'] as const)('offers only supported media in the %s state', (state) => {
        setupState.data = { state, has_catalog_items: false, system_shelves_ready: true, supported_media: ['album'], failure_code: null }
        renderPage()
        expect(screen.getByRole('button', { name: /Albums/ })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Books/ })).not.toBeInTheDocument()
    })

    it('keeps guided building discoverable after idempotent completion', () => {
        setupState.data = { state: 'complete', has_catalog_items: false, system_shelves_ready: true, supported_media: ['book', 'album'], failure_code: null }
        renderPage()
        expect(screen.getByRole('heading', { name: 'Your library is ready' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Manage Collection' })).toHaveAttribute('href', '/collection/manage')
    })

    it('creates and selects a first shelf before entering the existing intake engine', async () => {
        setupState.data = { state: 'required', has_catalog_items: false, system_shelves_ready: true, supported_media: ['book'], failure_code: null }
        createShelf.mockResolvedValue({ shelf_id: 'new-shelf', common_name: 'west_wall', created_date: '', updated_date: '' })
        renderPage()
        fireEvent.click(screen.getByRole('button', { name: /Books/ }))
        fireEvent.change(screen.getByLabelText('New shelf name'), { target: { value: 'west_wall' } })
        fireEvent.click(screen.getByRole('button', { name: 'Continue to Book Build Mode' }))
        await waitFor(() => expect(createShelf).toHaveBeenCalledWith({ common_name: 'west_wall' }))
        expect(window.localStorage.getItem('shade:andy:shared:guided-setup:v1')).toContain('new-shelf')
    })
})
