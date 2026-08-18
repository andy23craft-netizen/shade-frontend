import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    BookList,
    DashboardBreakdowns,
    DashboardIncompleteMetadata,
    DashboardSummary,
} from './apiTypes'

import type {
    createApiClient,
} from './apiClient'

import {
    createDashboardApi,
} from './dashboardApi'

function createClient() {
    return {
        request: vi.fn(),
        requestJson: vi.fn(),
        get: vi.fn(),
        getJson: vi.fn(),
    } as unknown as ReturnType<typeof createApiClient>
}

describe('createDashboardApi', () => {
    it('gets the dashboard using the typed response', async () => {
        const dashboard =
            {} as DashboardSummary

        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(dashboard)

        const api =
            createDashboardApi(client)

        const result = await api.get()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard',
        )

        expect(result).toBe(dashboard)
    })

    it('gets dashboard breakdowns', async () => {
        const breakdowns =
            {} as DashboardBreakdowns

        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(breakdowns)

        const api =
            createDashboardApi(client)

        const result =
            await api.getBreakdowns()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/breakdowns',
        )

        expect(result).toBe(breakdowns)
    })

    it('gets incomplete metadata counts', async () => {
        const incompleteMetadata =
            {} as DashboardIncompleteMetadata

        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(incompleteMetadata)

        const api =
            createDashboardApi(client)

        const result =
            await api.getIncompleteMetadata()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/incomplete-metadata',
        )

        expect(result).toBe(incompleteMetadata)
    })

    it('lists all books with incomplete metadata without a field filter', async () => {
        const books =
            {} as BookList

        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api =
            createDashboardApi(client)

        const result =
            await api.listIncompleteMetadataBooks()

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/incomplete-metadata/books',
        )

        expect(result).toBe(books)
    })

    it('filters incomplete metadata books by field', async () => {
        const books =
            {} as BookList

        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue(books)

        const api =
            createDashboardApi(client)

        await api.listIncompleteMetadataBooks({
            field: 'isbn',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/incomplete-metadata/books?field=isbn',
        )
    })

    it('trims the incomplete metadata field filter', async () => {
        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue({} as BookList)

        const api =
            createDashboardApi(client)

        await api.listIncompleteMetadataBooks({
            field: '  publisher  ',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/incomplete-metadata/books?field=publisher',
        )
    })

    it('omits a blank incomplete metadata field filter', async () => {
        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue({} as BookList)

        const api =
            createDashboardApi(client)

        await api.listIncompleteMetadataBooks({
            field: '   ',
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/incomplete-metadata/books',
        )
    })

    it('sends paired pagination parameters for incomplete metadata books', async () => {
        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue({} as BookList)

        const api =
            createDashboardApi(client)

        await api.listIncompleteMetadataBooks({
            field: 'shelf',
            skip: 30,
            take: 30,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/incomplete-metadata/books?field=shelf&skip=30&take=30',
        )
    })

    it('omits pagination when only skip is provided', async () => {
        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue({} as BookList)

        const api =
            createDashboardApi(client)

        await api.listIncompleteMetadataBooks({
            skip: 30,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/incomplete-metadata/books',
        )
    })

    it('omits pagination when only take is provided', async () => {
        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue({} as BookList)

        const api =
            createDashboardApi(client)

        await api.listIncompleteMetadataBooks({
            take: 30,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/incomplete-metadata/books',
        )
    })

    it('passes an abort signal to dashboard report requests', async () => {
        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue({} as DashboardBreakdowns)

        const api =
            createDashboardApi(client)

        const controller =
            new AbortController()

        await api.getBreakdowns({
            signal: controller.signal,
        })

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/breakdowns',
            {
                signal: controller.signal,
            },
        )
    })

    it('passes an abort signal to incomplete metadata book requests', async () => {
        const client = createClient()

        vi.mocked(client.getJson)
            .mockResolvedValue({} as BookList)

        const api =
            createDashboardApi(client)

        const controller =
            new AbortController()

        await api.listIncompleteMetadataBooks(
            {
                field: 'pages',
                skip: 0,
                take: 30,
            },
            {
                signal: controller.signal,
            },
        )

        expect(
            client.getJson,
        ).toHaveBeenCalledWith(
            '/dashboard/incomplete-metadata/books?field=pages&skip=0&take=30',
            {
                signal: controller.signal,
            },
        )
    })
})
