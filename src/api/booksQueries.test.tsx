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
    BookUpdate,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
} from './apiTypes'

import {
    useBook,
    useBookLookup,
    useBooks,
    useCreateBook,
    useUpdateBook,
    useDeleteBook,
    useRestoreBook,
    useCheckoutBook,
    useCheckinBook,
    useMarkBookRead,
} from './booksQueries'

const mockList = vi.fn()
const mockGet = vi.fn()
const mockLookup = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockRemove = vi.fn()
const mockRestore = vi.fn()
const mockCheckout = vi.fn()
const mockCheckin = vi.fn()
const mockMarkRead = vi.fn()

vi.mock('./booksApi', () => ({
    createBooksApi: () => ({
        list: mockList,
        get: mockGet,
        lookup: mockLookup,
        create: mockCreate,
        update: mockUpdate,
        remove: mockRemove,
        restore: mockRestore,
        checkout: mockCheckout,
        checkin: mockCheckin,
        markRead: mockMarkRead,
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


it(
    'updates a book and invalidates book caches',
    async () => {
        const bookInput =
            {} as BookUpdate

        const updatedBook =
            {} as BookRead

        mockUpdate.mockResolvedValueOnce(
            updatedBook,
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

        const { result } =
            renderHook(
                () => useUpdateBook(),
                {
                    wrapper: Wrapper,
                },
            )

        await result.current.mutateAsync({
            id: 'book-123',
            book: bookInput,
        })

        expect(
            mockUpdate,
        ).toHaveBeenCalledWith(
            'book-123',
            bookInput,
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books'],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'books',
                'book-123',
            ],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['dashboard'],
        })

        queryClient.clear()
    },
)

it(
    'deletes a book and invalidates book caches',
    async () => {
        mockRemove.mockResolvedValueOnce(
            undefined,
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

        const { result } =
            renderHook(
                () => useDeleteBook(),
                {
                    wrapper: Wrapper,
                },
            )

        await result.current.mutateAsync(
            'book-123',
        )

        expect(
            mockRemove,
        ).toHaveBeenCalledWith(
            'book-123',
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books'],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'books',
                'book-123',
            ],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['dashboard'],
        })

        queryClient.clear()
    },
)

it(
    'restores a book and invalidates book caches',
    async () => {
        const restoredBook =
            {} as BookRead

        mockRestore.mockResolvedValueOnce(
            restoredBook,
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

        const { result } =
            renderHook(
                () => useRestoreBook(),
                {
                    wrapper: Wrapper,
                },
            )

        await result.current.mutateAsync(
            'book-123',
        )

        expect(
            mockRestore,
        ).toHaveBeenCalledWith(
            'book-123',
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books'],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'books',
                'book-123',
            ],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['dashboard'],
        })

        queryClient.clear()
    },
)

it(
    'checks out a book and invalidates loans and dashboard',
    async () => {
        const request =
            {} as CheckoutRequest

        const book =
            {} as BookRead

        mockCheckout.mockResolvedValueOnce(
            book,
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

        const { result } =
            renderHook(
                () => useCheckoutBook(),
                {
                    wrapper: Wrapper,
                },
            )

        await result.current.mutateAsync({
            id: 'book-123',
            request,
        })

        expect(
            mockCheckout,
        ).toHaveBeenCalledWith(
            'book-123',
            request,
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books'],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'books',
                'book-123',
            ],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['loans'],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['dashboard'],
        })

        queryClient.clear()
    },
)

it(
    'checks in a book and invalidates loans and dashboard',
    async () => {
        const request =
            {} as CheckinRequest

        const book =
            {} as BookRead

        mockCheckin.mockResolvedValueOnce(
            book,
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

        const { result } =
            renderHook(
                () => useCheckinBook(),
                {
                    wrapper: Wrapper,
                },
            )

        await result.current.mutateAsync({
            id: 'book-123',
            request,
        })

        expect(
            mockCheckin,
        ).toHaveBeenCalledWith(
            'book-123',
            request,
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books'],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'books',
                'book-123',
            ],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['loans'],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['dashboard'],
        })

        queryClient.clear()
    },
)

it(
    'marks a book as read and invalidates book and dashboard caches',
    async () => {
        const request =
            {} as MarkReadRequest

        const book =
            {} as BookRead

        mockMarkRead.mockResolvedValueOnce(
            book,
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

        const { result } =
            renderHook(
                () => useMarkBookRead(),
                {
                    wrapper: Wrapper,
                },
            )

        await result.current.mutateAsync({
            id: 'book-123',
            request,
        })

        expect(
            mockMarkRead,
        ).toHaveBeenCalledWith(
            'book-123',
            request,
        )

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['books'],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: [
                'books',
                'book-123',
            ],
        })

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['dashboard'],
        })

        expect(
            invalidateQueries,
        ).not.toHaveBeenCalledWith({
            queryKey: ['loans'],
        })

        queryClient.clear()
    },
)

})
