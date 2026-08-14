import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { ApiError } from '../../../api/apiErrors'
import {
    createBackupApi,
} from '../../../api/backupApi'
import {
    useConnection,
} from '../../connection/useConnection'
import { BackupLibraryPage } from './BackupLibraryPage'

vi.mock('../../../api/backupApi', () => ({
    createBackupApi: vi.fn(),
}))

vi.mock('../../connection/useConnection', () => ({
    useConnection: vi.fn(),
}))

const mockCreateBackupApi =
    vi.mocked(createBackupApi)
const mockUseConnection =
    vi.mocked(useConnection)

const mockGet = vi.fn()

describe('BackupLibraryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockUseConnection.mockReturnValue({
            apiClient: {},
        } as unknown as ReturnType<
            typeof useConnection
        >)

        mockCreateBackupApi.mockReturnValue({
            get: mockGet,
        })
    })

    it('warns that the backup contains complete library history', () => {
        render(<BackupLibraryPage />)

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'active and deleted books',
        )

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'complete loan history',
        )
    })

    it('downloads a successful SQL backup and cleans up the object URL', async () => {
        const blob = new Blob(
            ['CREATE TABLE books (...);'],
            {
                type: 'application/sql',
            },
        )

        mockGet.mockResolvedValue({
            blob,
            filename: 'shade-backup.sql',
        })

        const createObjectURL =
            vi.spyOn(
                URL,
                'createObjectURL',
            ).mockReturnValue(
                'blob:test-backup',
            )

        const revokeObjectURL =
            vi.spyOn(
                URL,
                'revokeObjectURL',
            ).mockImplementation(
                () => undefined,
            )

        const click = vi.spyOn(
            HTMLAnchorElement.prototype,
            'click',
        ).mockImplementation(
            () => undefined,
        )

        render(<BackupLibraryPage />)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Download Backup',
            }),
        )

        await waitFor(() => {
            expect(
                mockGet,
            ).toHaveBeenCalledOnce()
        })

        expect(
            createObjectURL,
        ).toHaveBeenCalledWith(blob)

        expect(click).toHaveBeenCalledOnce()

        expect(
            revokeObjectURL,
        ).toHaveBeenCalledWith(
            'blob:test-backup',
        )

        expect(
            document.querySelector(
                'a[download="shade-backup.sql"]',
            ),
        ).not.toBeInTheDocument()
    })

    it('does not create a download after rejected access', async () => {
        mockGet.mockRejectedValue(
            new ApiError({
                kind: 'unauthorized',
                status: 403,
                message:
                    'API access was rejected.',
            }),
        )

        const createObjectURL =
            vi.spyOn(
                URL,
                'createObjectURL',
            ).mockReturnValue(
                'blob:should-not-exist',
            )

        render(<BackupLibraryPage />)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Download Backup',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'The API rejected the backup request',
        )

        expect(
            createObjectURL,
        ).not.toHaveBeenCalled()
    })

    it('shows the generation failure detail and does not download', async () => {
        mockGet.mockRejectedValue(
            new ApiError({
                kind: 'server',
                status: 500,
                message:
                    'Failed to generate database backup',
                detail:
                    'Failed to generate database backup',
            }),
        )

        const createObjectURL =
            vi.spyOn(
                URL,
                'createObjectURL',
            ).mockReturnValue(
                'blob:should-not-exist',
            )

        render(<BackupLibraryPage />)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Download Backup',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'Failed to generate database backup',
        )

        expect(
            createObjectURL,
        ).not.toHaveBeenCalled()
    })

    it('shows an interrupted connection failure and does not download', async () => {
        mockGet.mockRejectedValue(
            new ApiError({
                kind: 'unreachable',
                message:
                    'Network request failed.',
            }),
        )

        const createObjectURL =
            vi.spyOn(
                URL,
                'createObjectURL',
            ).mockReturnValue(
                'blob:should-not-exist',
            )

        render(<BackupLibraryPage />)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Download Backup',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'The connection was interrupted',
        )

        expect(
            createObjectURL,
        ).not.toHaveBeenCalled()
    })

    it('shows a timeout failure and does not download', async () => {
        mockGet.mockRejectedValue(
            new ApiError({
                kind: 'timeout',
                message:
                    'Request timed out.',
            }),
        )

        const createObjectURL =
            vi.spyOn(
                URL,
                'createObjectURL',
            ).mockReturnValue(
                'blob:should-not-exist',
            )

        render(<BackupLibraryPage />)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Download Backup',
            }),
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'The backup request timed out',
        )

        expect(
            createObjectURL,
        ).not.toHaveBeenCalled()
    })

    it('prevents duplicate requests while a download is pending', async () => {
        let resolveBackup:
            | ((
            value: {
                blob: Blob
                filename: string
            },
        ) => void)
            | undefined

        mockGet.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveBackup = resolve
                }),
        )

        const createObjectURL =
            vi.spyOn(
                URL,
                'createObjectURL',
            ).mockReturnValue(
                'blob:test-backup',
            )

        vi.spyOn(
            URL,
            'revokeObjectURL',
        ).mockImplementation(
            () => undefined,
        )

        vi.spyOn(
            HTMLAnchorElement.prototype,
            'click',
        ).mockImplementation(
            () => undefined,
        )

        render(<BackupLibraryPage />)

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Download Backup',
            }),
        )

        expect(
            screen.getByRole('button', {
                name: 'Downloading…',
            }),
        ).toBeDisabled()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Downloading…',
            }),
        )

        expect(
            mockGet,
        ).toHaveBeenCalledOnce()

        resolveBackup?.({
            blob: new Blob(['SQL']),
            filename: 'backup.sql',
        })

        await waitFor(() => {
            expect(
                createObjectURL,
            ).toHaveBeenCalledOnce()
        })
    })
})
