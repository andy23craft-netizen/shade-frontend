import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/apiErrors'
import { queryKeys } from '../../api/queryKeys'
import { Button } from '../../components/Button'
import { SiteReadOnlyProvider } from './SiteReadOnlyProvider'
import { SiteReadOnlyBanner } from './SiteReadOnlyBanner'
import { SiteReadOnlyToggle } from './SiteReadOnlyToggle'
import { useSiteReadOnly } from './useSiteReadOnly'
import { notifySiteEnteredReadOnly } from './siteReadOnlyBridge'
import { resolveLibraryContext } from '../../config/libraryContext'

const authState = {
    isAdmin: true,
    mode: 'admin' as const,
    apiClient: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
}

const statusState = {
    data: { enabled: false } as { enabled: boolean } | undefined,
    isPending: false,
    isError: false,
    isSuccess: true,
    error: null as unknown,
    dataUpdatedAt: 1,
}

const updateState = {
    mutate: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null as unknown,
    data: undefined as { enabled: boolean } | undefined,
}

vi.mock('../auth/useAuth', () => ({
    useAuth: () => authState,
}))

vi.mock('../../config/libraryContext', () => ({
    resolveLibraryContext: vi.fn(() => ({
        id: 'andy',
        name: "Andy's Library",
        wordmark: 'Shade',
    })),
}))

vi.mock('../../api/libraryQueries', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../api/libraryQueries')>()
    return {
        ...actual,
        currentLibraryHost: () => 'andy',
        useSiteReadOnlyStatus: () => statusState,
        useUpdateSiteReadOnly: () => updateState,
    }
})

function WriteProbe() {
    const { writesDisabled, enabled } = useSiteReadOnly()
    return (
        <div>
            <span data-testid="enabled">{String(enabled)}</span>
            <span data-testid="writes-disabled">{String(writesDisabled)}</span>
            <Button mutating>Save Book</Button>
        </div>
    )
}

function renderWithProvider(ui: React.ReactNode, client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
})) {
    return {
        client,
        ...render(
            <QueryClientProvider client={client}>
                <SiteReadOnlyProvider>{ui}</SiteReadOnlyProvider>
            </QueryClientProvider>,
        ),
    }
}

describe('SiteReadOnlyProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.isAdmin = true
        statusState.data = { enabled: false }
        statusState.isSuccess = true
        statusState.isError = false
        statusState.isPending = false
        statusState.dataUpdatedAt = 1
        updateState.isError = false
        updateState.isSuccess = false
        updateState.error = null
        updateState.data = undefined
        vi.mocked(resolveLibraryContext).mockReturnValue({
            id: 'andy',
            name: "Andy's Library",
            wordmark: 'Shade',
        })
    })

    it('fails open when status GET is unsuccessful', () => {
        statusState.isSuccess = false
        statusState.isError = true
        statusState.data = undefined
        renderWithProvider(<WriteProbe />)
        expect(screen.getByTestId('writes-disabled')).toHaveTextContent('false')
        expect(screen.getByRole('button', { name: 'Save Book' })).not.toBeDisabled()
    })

    it('disables mutating controls when status is enabled', () => {
        statusState.data = { enabled: true }
        renderWithProvider(<WriteProbe />)
        expect(screen.getByTestId('writes-disabled')).toHaveTextContent('true')
        expect(screen.getByRole('button', { name: 'Save Book' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Save Book' })).toHaveAttribute(
            'title',
            'Site is in read-only mode',
        )
    })

    it('re-skins to enabled when a live 530 notification arrives', async () => {
        statusState.data = { enabled: false }
        const { client } = renderWithProvider(<WriteProbe />)
        expect(screen.getByRole('button', { name: 'Save Book' })).not.toBeDisabled()

        notifySiteEnteredReadOnly()

        await waitFor(() => {
            expect(client.getQueryData(queryKeys.library.siteReadOnly('andy'))).toEqual({
                enabled: true,
            })
        })

        // The mocked status hook still returns enabled:false; mirror the cache write
        // the real useSiteReadOnlyStatus would observe after setQueryData.
        statusState.data = { enabled: true }
        statusState.dataUpdatedAt = 2
        renderWithProvider(<WriteProbe />, client)
        expect(screen.getAllByTestId('writes-disabled').at(-1)).toHaveTextContent('true')
    })

    it('shows an admin banner only while read-only is enabled', () => {
        statusState.data = { enabled: true }
        renderWithProvider(<SiteReadOnlyBanner />)
        expect(screen.getByRole('status')).toHaveTextContent(/Site is in read-only mode/i)
    })

    it('hides the banner when read-only is off', () => {
        statusState.data = { enabled: false }
        renderWithProvider(<SiteReadOnlyBanner />)
        expect(screen.queryByText(/Site is in read-only mode/i)).not.toBeInTheDocument()
    })
})

describe('SiteReadOnlyToggle', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        authState.isAdmin = true
        statusState.data = { enabled: false }
        statusState.isSuccess = true
        statusState.isError = false
        updateState.isPending = false
        vi.mocked(resolveLibraryContext).mockReturnValue({
            id: 'andy',
            name: "Andy's Library",
            wordmark: 'Shade',
        })
    })

    it('requires confirmation before enabling read-only', () => {
        renderWithProvider(<SiteReadOnlyToggle />)
        fireEvent.click(screen.getByRole('switch', { name: /Read-only off/i }))
        expect(screen.getByRole('dialog')).toHaveTextContent(/Turn on site-wide read-only mode/i)
        expect(updateState.mutate).not.toHaveBeenCalled()
        fireEvent.click(screen.getByRole('button', { name: 'Turn read-only on' }))
        expect(updateState.mutate).toHaveBeenCalledWith(
            { enabled: true },
            expect.any(Object),
        )
    })

    it('keeps the toggle available while read-only is already on', () => {
        statusState.data = { enabled: true }
        renderWithProvider(<SiteReadOnlyToggle />)
        const toggle = screen.getByRole('switch', { name: /Read-only on/i })
        expect(toggle).not.toBeDisabled()
        fireEvent.click(toggle)
        expect(screen.getByRole('dialog')).toHaveTextContent(/Turn off site-wide read-only mode/i)
        fireEvent.click(screen.getByRole('button', { name: 'Turn read-only off' }))
        expect(updateState.mutate).toHaveBeenCalledWith(
            { enabled: false },
            expect.any(Object),
        )
    })

    it('surfaces site read-only failures distinctly', () => {
        updateState.isError = true
        updateState.error = new ApiError({
            kind: 'site_read_only',
            status: 530,
            message: 'Site is in read-only mode.',
            detail: 'Site is in read-only mode',
        })
        renderWithProvider(<SiteReadOnlyToggle />)
        expect(screen.getByRole('alert')).toHaveTextContent(
            /Site is in read-only mode/i,
        )
    })

    it('hides the toggle for non-Shade library admins', () => {
        vi.mocked(resolveLibraryContext).mockReturnValue({
            id: 'dalmo',
            name: "Dalmo's Library",
            wordmark: 'Dalmo',
        })
        renderWithProvider(<SiteReadOnlyToggle />)
        expect(screen.queryByRole('switch', { name: /Read-only/i })).not.toBeInTheDocument()
    })
})
