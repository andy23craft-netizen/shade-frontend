import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConnectionScreen } from './ConnectionScreen'
import { useConnection } from './useConnection'

vi.mock('./useConnection', () => ({
    useConnection: vi.fn(),
}))

const mockedUseConnection = vi.mocked(useConnection)

function createConnectionState(
    overrides: Partial<ReturnType<typeof useConnection>> = {},
) {
    return {
        status: 'setup_required' as const,
        apiBaseUrl: 'https://library.example.com',
        release: 'test',
        hasToken: false,
        errorMessage: null,
        apiClient: {
            request: vi.fn(),
            requestJson: vi.fn(),
            get: vi.fn(),
            getJson: vi.fn(),
        },
        connect: vi.fn().mockResolvedValue(true),
        retry: vi.fn().mockResolvedValue(undefined),
        forgetConnection: vi.fn(),
        ...overrides,
    }
}

beforeEach(() => {
    vi.clearAllMocks()

    mockedUseConnection.mockReturnValue(
        createConnectionState(),
    )
})

describe('ConnectionScreen', () => {
    it('shows the setup form when a connection is required', () => {
        render(<ConnectionScreen />)

        expect(
            screen.getByRole('heading', {
                name: 'Connect to Shade',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('heading', {
                name: 'API authentication',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('API token'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Connect',
            }),
        ).toBeInTheDocument()
    })

    it('shows the checking state while the connection is being verified', () => {
        mockedUseConnection.mockReturnValue(
            createConnectionState({
                status: 'checking',
            }),
        )

        render(<ConnectionScreen />)

        expect(
            screen.getByRole('heading', {
                name: 'Connecting to Shade',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Checking the connection to the library API…',
            ),
        ).toBeInTheDocument()
    })

    it('shows an actionable unreachable state', () => {
        const retry = vi.fn().mockResolvedValue(undefined)

        mockedUseConnection.mockReturnValue(
            createConnectionState({
                status: 'unreachable',
                errorMessage: 'Unable to reach the Shade API.',
                retry,
            }),
        )

        render(<ConnectionScreen />)

        expect(
            screen.getByText(
                'Unable to reach the Shade API.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Make sure the Shade API is running and reachable, then try again.',
            ),
        ).toBeInTheDocument()

        const retryButton = screen.getByRole('button', {
            name: 'Retry connection',
        })

        expect(retryButton).toBeInTheDocument()

        fireEvent.click(retryButton)

        expect(retry).toHaveBeenCalledOnce()
    })

    it('shows an actionable rejected-token state', () => {
        mockedUseConnection.mockReturnValue(
            createConnectionState({
                status: 'unauthorized',
                errorMessage: 'The API token was rejected.',
            }),
        )

        render(<ConnectionScreen />)

        expect(
            screen.getByText(
                'The API token was rejected.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Enter a valid API token and try again.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('API token'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Connect',
            }),
        ).toBeInTheDocument()
    })

    it('shows the verified connected state', () => {
        const forgetConnection = vi.fn()

        mockedUseConnection.mockReturnValue(
            createConnectionState({
                status: 'connected',
                hasToken: true,
                forgetConnection,
            }),
        )

        render(<ConnectionScreen />)

        expect(
            screen.getByRole('heading', {
                name: 'Connected',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'This browser is connected to the Shade API.',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Check connection',
            }),
        ).toBeInTheDocument()

        const forgetButton = screen.getByRole('button', {
            name: 'Forget connection',
        })

        expect(forgetButton).toBeInTheDocument()

        fireEvent.click(forgetButton)

        expect(forgetConnection).toHaveBeenCalledOnce()
    })

    it('connects with the entered token and clears the field after success', async () => {
        const connect = vi
            .fn()
            .mockResolvedValue(true)

        mockedUseConnection.mockReturnValue(
            createConnectionState({
                connect,
            }),
        )

        render(<ConnectionScreen />)

        const tokenInput = screen.getByLabelText('API token')

        fireEvent.change(tokenInput, {
            target: {
                value: 'test-api-token',
            },
        })

        expect(tokenInput).toHaveValue('test-api-token')

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Connect',
            }),
        )

        await waitFor(() => {
            expect(connect).toHaveBeenCalledWith(
                'test-api-token',
            )
        })

        await waitFor(() => {
            expect(tokenInput).toHaveValue('')
        })
    })
})
