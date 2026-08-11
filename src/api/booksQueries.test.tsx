import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import {
    renderHook,
    waitFor,
} from '@testing-library/react'
import {
    type ReactNode,
} from 'react'

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    BookCreate,
    BookList,
    BookLookupResponse,
    BookRead,
} from './apiTypes'

import {
    useBook,
    useBookLookup,
    useBooks,
    useCreateBook,
} from './booksQueries'

const mockList = vi.fn()
const mockGet = vi.fn()
const mockLookup = vi.fn()
const mockCreate = vi.fn()

vi.mock('./booksApi', () => ({
    createBooksApi: () => ({
        list: mockList,
        get: mockGet,
        lookup: mockLookup,
        create: mockCreate,
    }),
}))

vi.mock(
    '../features/connection/useConnection',
    () => ({
        useConnection: () => ({
            apiClient: {},
        }),
    }),
)

function createWrapper() {
    const queryClient =
        new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        })

    function Wrapper({
                         children,
                     }: {
        children: ReactNode
    }) {
        return (
            <QueryClientProvider
                client={queryClient}
            >
                {children}
            </QueryClientProvider>
        )
    }

    return {
        Wrapper,
        queryClient,
    }
}

describe('book queries', () => {
    it('loads books through the books API', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        mockList.mockResolvedValueOnce(books)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useBooks(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockList,
        ).toHaveBeenCalledOnce()

        expect(
            result.current.data,
        ).toEqual(books)

        queryClient.clear()
    })

    it('loads a single book by id', async () => {
        const book =
            {} as BookRead

        mockGet.mockResolvedValueOnce(book)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useBook('book-123'),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockGet,
        ).toHaveBeenCalledWith(
            'book-123',
        )

        expect(
            result.current.data,
        ).toEqual(book)

        queryClient.clear()
    })

    it('looks up a book by ISBN', async () => {
        const lookup =
            {} as BookLookupResponse

        mockLookup.mockResolvedValueOnce(
            lookup,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () =>
                useBookLookup(
                    '9781234567890',
                ),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            mockLookup,
        ).toHaveBeenCalledWith(
            '9781234567890',
        )

        expect(
            result.current.data,
        ).toEqual(lookup)

        queryClient.clear()
    })

    it('creates a book and invalidates the books cache', async () => {
        const bookInput =
            {} as BookCreate

        const createdBook =
            {} as BookRead

        mockCreate.mockResolvedValueOnce(
            createdBook,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const invalidateQueries =
            vi.spyOn(
                queryClient,
                'invalidateQueries',
            )

        const { result } = renderHook(
            () => useCreateBook(),
            {
                wrapper: Wrapper,
            },
        )

        const resultBook =
            await result.current.mutateAsync(
                bookInput,
            )

        expect(resultBook).toEqual(createdBook)
        
        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books'],
        })

        queryClient.clear()
    })
})
