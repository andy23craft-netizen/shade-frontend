import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    createApiClient,
} from './apiClient'

import {
    createBackupApi,
} from './backupApi'

describe('createBackupApi', () => {
    it(
        'gets the SQL backup as a blob with its filename',
        async () => {
            const response = new Response(
                'CREATE TABLE books (...);',
                {
                    status: 200,
                    headers: {
                        'Content-Type':
                            'application/sql',
                        'Content-Disposition':
                            'attachment; filename="shade-backup.sql"',
                    },
                },
            )

            const client:
                ReturnType<typeof createApiClient> = {
                request: vi.fn(),
                requestJson: vi.fn(),
                get: vi.fn()
                    .mockResolvedValue(response),
                getJson: vi.fn(),
            }

            const api =
                createBackupApi(client)

            const result =
                await api.get()

            expect(
                client.get,
            ).toHaveBeenCalledWith(
                '/backup',
            )

            expect(
                result.filename,
            ).toBe(
                'shade-backup.sql',
            )

            expect(
                result.blob,
            ).toBeInstanceOf(Blob)

            expect(
                result.blob.type,
            ).toBe(
                'application/sql',
            )

            await expect(
                result.blob.text(),
            ).resolves.toBe(
                'CREATE TABLE books (...);',
            )
        },
    )

    it(
        'supports UTF-8 Content-Disposition filenames',
        async () => {
            const response = new Response(
                'CREATE TABLE books (...);',
                {
                    status: 200,
                    headers: {
                        'Content-Type':
                            'application/sql',
                        'Content-Disposition':
                            "attachment; filename*=UTF-8''shade%20backup.sql",
                    },
                },
            )

            const client:
                ReturnType<typeof createApiClient> = {
                request: vi.fn(),
                requestJson: vi.fn(),
                get: vi.fn()
                    .mockResolvedValue(response),
                getJson: vi.fn(),
            }

            const api =
                createBackupApi(client)

            const result =
                await api.get()

            expect(
                result.filename,
            ).toBe(
                'shade backup.sql',
            )
        },
    )

    it(
        'uses a fallback filename when none is provided',
        async () => {
            const response = new Response(
                'CREATE TABLE books (...);',
                {
                    status: 200,
                    headers: {
                        'Content-Type':
                            'application/sql',
                    },
                },
            )

            const client:
                ReturnType<typeof createApiClient> = {
                request: vi.fn(),
                requestJson: vi.fn(),
                get: vi.fn()
                    .mockResolvedValue(response),
                getJson: vi.fn(),
            }

            const api =
                createBackupApi(client)

            const result =
                await api.get()

            expect(
                result.filename,
            ).toBe(
                'backup.sql',
            )
        },
    )

    it(
        'removes path separators from the filename',
        async () => {
            const response = new Response(
                'CREATE TABLE books (...);',
                {
                    status: 200,
                    headers: {
                        'Content-Type':
                            'application/sql',
                        'Content-Disposition':
                            'attachment; filename="../backup.sql"',
                    },
                },
            )

            const client:
                ReturnType<typeof createApiClient> = {
                request: vi.fn(),
                requestJson: vi.fn(),
                get: vi.fn()
                    .mockResolvedValue(response),
                getJson: vi.fn(),
            }

            const api =
                createBackupApi(client)

            const result =
                await api.get()

            expect(
                result.filename,
            ).toBe(
                '.._backup.sql',
            )
        },
    )
})
