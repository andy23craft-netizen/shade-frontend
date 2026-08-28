import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    createApiClient,
} from './apiClient'
import {
    createAuthorsApi,
} from './authorsApi'

const mockGetJson = vi.fn()
const mockRequestJson = vi.fn()
const mockRequest = vi.fn()

const client = {
    getJson: mockGetJson,
    requestJson: mockRequestJson,
    request: mockRequest,
} as unknown as ReturnType<typeof createApiClient>

describe('createAuthorsApi', () => {
    beforeEach(() => {
        mockGetJson.mockReset()
        mockRequestJson.mockReset()
        mockRequest.mockReset()
    })

    it('lists authors', async () => {
        mockGetJson.mockResolvedValue({
            items: [
                {
                    author_id: 'author-1',
                    first_name: 'Ursula',
                    surname: 'Le Guin',
                    created_date:
                        '2026-01-01T00:00:00Z',
                    updated_date:
                        '2026-01-01T00:00:00Z',
                },
            ],
            total: 1,
        })

        const authorsApi =
            createAuthorsApi(client)

        const result = await authorsApi.list()

        expect(mockGetJson).toHaveBeenCalledWith(
            '/authors',
        )

        expect(result).toEqual({
            items: [
                {
                    author_id: 'author-1',
                    first_name: 'Ursula',
                    surname: 'Le Guin',
                    created_date:
                        '2026-01-01T00:00:00Z',
                    updated_date:
                        '2026-01-01T00:00:00Z',
                },
            ],
            total: 1,
        })
    })

    it('passes an abort signal when listing authors', async () => {
        mockGetJson.mockResolvedValue({
            items: [],
            total: 0,
        })

        const authorsApi =
            createAuthorsApi(client)

        const controller =
            new AbortController()

        await authorsApi.list({
            signal: controller.signal,
        })

        expect(mockGetJson).toHaveBeenCalledWith(
            '/authors',
            {
                signal: controller.signal,
            },
        )
    })

    it('gets an author by id', async () => {
        mockGetJson.mockResolvedValue({
            author_id: 'author-1',
            first_name: 'Ursula',
            surname: 'Le Guin',
            created_date:
                '2026-01-01T00:00:00Z',
            updated_date:
                '2026-01-01T00:00:00Z',
        })

        const authorsApi =
            createAuthorsApi(client)

        await authorsApi.get('author/1')

        expect(mockGetJson).toHaveBeenCalledWith(
            '/authors/author%2F1',
            undefined,
        )
    })

    it('creates an author', async () => {
        mockRequestJson.mockResolvedValue({
            author_id: 'author-1',
            first_name: 'Ursula',
            surname: 'Le Guin',
            created_date:
                '2026-01-01T00:00:00Z',
            updated_date:
                '2026-01-01T00:00:00Z',
        })

        const authorsApi =
            createAuthorsApi(client)

        await authorsApi.create({
            first_name: ' Ursula ',
            surname: ' Le Guin ',
        })

        expect(
            mockRequestJson,
        ).toHaveBeenCalledWith(
            '/authors',
            {
                method: 'POST',
                body: {
                    first_name: ' Ursula ',
                    surname: ' Le Guin ',
                },
            },
        )
    })

    it('creates an author with a null first name', async () => {
        mockRequestJson.mockResolvedValue({
            author_id: 'author-1',
            first_name: null,
            surname: 'Homer',
            created_date:
                '2026-01-01T00:00:00Z',
            updated_date:
                '2026-01-01T00:00:00Z',
        })

        const authorsApi =
            createAuthorsApi(client)

        await authorsApi.create({
            first_name: null,
            surname: 'Homer',
        })

        expect(
            mockRequestJson,
        ).toHaveBeenCalledWith(
            '/authors',
            {
                method: 'POST',
                body: {
                    first_name: null,
                    surname: 'Homer',
                },
            },
        )
    })

    it('updates an author with a partial patch', async () => {
        mockRequestJson.mockResolvedValue({
            author_id: 'author-1',
            first_name: 'Ursula K.',
            surname: 'Le Guin',
            created_date:
                '2026-01-01T00:00:00Z',
            updated_date:
                '2026-01-02T00:00:00Z',
        })

        const authorsApi =
            createAuthorsApi(client)

        await authorsApi.update(
            'author/1',
            {
                first_name: 'Ursula K.',
            },
        )

        expect(
            mockRequestJson,
        ).toHaveBeenCalledWith(
            '/authors/author%2F1',
            {
                method: 'PATCH',
                body: {
                    first_name: 'Ursula K.',
                },
            },
        )
    })

    it('deletes an author', async () => {
        mockRequest.mockResolvedValue(
            new Response(null, {
                status: 204,
            }),
        )

        const authorsApi =
            createAuthorsApi(client)

        await authorsApi.remove('author/1')

        expect(mockRequest).toHaveBeenCalledWith(
            '/authors/author%2F1',
            {
                method: 'DELETE',
            },
        )
    })

    it('passes an abort signal to author writes', async () => {
        mockRequestJson.mockResolvedValue({
            author_id: 'author-1',
            first_name: 'Ursula',
            surname: 'Le Guin',
            created_date:
                '2026-01-01T00:00:00Z',
            updated_date:
                '2026-01-01T00:00:00Z',
        })

        const authorsApi =
            createAuthorsApi(client)

        const controller =
            new AbortController()

        await authorsApi.update(
            'author-1',
            {
                surname: 'Le Guin',
            },
            {
                signal: controller.signal,
            },
        )

        expect(
            mockRequestJson,
        ).toHaveBeenCalledWith(
            '/authors/author-1',
            {
                method: 'PATCH',
                body: {
                    surname: 'Le Guin',
                },
                signal: controller.signal,
            },
        )
    })
})
