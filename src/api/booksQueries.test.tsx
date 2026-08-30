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
    beforeEach,
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
    BulkShelfMoveRequest,
    BulkShelfMoveResponse,
    CheckinRequest,
    CheckoutRequest,
    MarkReadRequest,
} from './apiTypes'

import {
    ApiError,
} from './apiErrors'

import {
    useBook,
    useBookCover,
    useBookLookup,
    useBooks,
    useCreateBook,
    useUpdateBook,
    useUploadBookCover,
    useRemoveBookCover,
    useBulkMoveBooksToShelf,
    useDeleteBook,
    useCheckoutBook,
    useCheckinBook,
    useMarkBookRead,
    useInfiniteBooks,
    useRecentBooks,
} from './booksQueries'

const mockList = vi.fn()
const mockGet = vi.fn()
const mockGetCover = vi.fn()
const mockUploadCover = vi.fn()
const mockRemoveCover = vi.fn()
const mockLookup = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockRemove = vi.fn()
const mockCheckout = vi.fn()
const mockCheckin = vi.fn()
const mockMarkRead = vi.fn()
const mockMoveToShelf = vi.fn()

vi.mock('./booksApi', () => ({
    createBooksApi: () => ({
        list: mockList,
        get: mockGet,
        getCover: mockGetCover,
        uploadCover: mockUploadCover,
        removeCover: mockRemoveCover,
        lookup: mockLookup,
        create: mockCreate,
        update: mockUpdate,
        moveToShelf: mockMoveToShelf,
        remove: mockRemove,
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
    beforeEach(() => {
        mockGetCover.mockReset()
        mockUploadCover.mockReset()
        mockRemoveCover.mockReset()
    })

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

    it('passes pagination and sort options to the books API', async () => {
        const books: BookList = {
            items: [],
            total: 100,
        }

        mockList.mockResolvedValueOnce(books)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () =>
                useBooks({
                    skip: 50,
                    take: 50,
                    sortBy: 'title',
                    sortOrder: 'desc',
                }),
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
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 50,
                take: 50,
                sortBy: 'title',
                sortOrder: 'desc',
            }),
        )

        queryClient.clear()
    })

    it('loads the ten newest books for Home discovery', async () => {
        const books: BookList = {
            items: [],
            total: 10,
        }

        mockList.mockResolvedValueOnce(books)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useRecentBooks(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        expect(mockList).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 0,
                take: 10,
                sortBy: 'creationDate',
                sortOrder: 'desc',
            }),
        )

        expect(result.current.data).toEqual(books)

        queryClient.clear()
    })

    it('passes author, title, and category filters to the books API', async () => {
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
            () =>
                useBooks({
                    author: 'Le Guin',
                    title: 'Darkness',
                    categoryIds: ['cat-fiction'],
                    shelfName: 'e4',
                    isRead: false,
                }),
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
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                author: 'Le Guin',
                title: 'Darkness',
                categoryIds: ['cat-fiction'],
                shelfName: 'e4',
                isRead: false,
            }),
        )

        queryClient.clear()
    })

    it('uses distinct query keys for filtered book lists', async () => {
        const books: BookList = {
            items: [],
            total: 0,
        }

        mockList.mockResolvedValue(books)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const first = renderHook(
            () =>
                useBooks({
                    author: 'Le Guin',
                }),
            {
                wrapper: Wrapper,
            },
        )

        const second = renderHook(
            () =>
                useBooks({
                    title: 'Darkness',
                }),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                first.result.current.isSuccess,
            ).toBe(true),
        )

        await waitFor(() =>
            expect(
                second.result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            queryClient.getQueryCache().getAll(),
        ).toHaveLength(2)

        queryClient.clear()
    })

    it('uses distinct query keys per page and sort', async () => {
        const books: BookList = {
            items: [],
            total: 100,
        }

        mockList.mockResolvedValue(books)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const first = renderHook(
            () =>
                useBooks({
                    skip: 0,
                    take: 50,
                    sortBy: 'author',
                    sortOrder: 'asc',
                }),
            {
                wrapper: Wrapper,
            },
        )

        const second = renderHook(
            () =>
                useBooks({
                    skip: 50,
                    take: 50,
                    sortBy: 'title',
                    sortOrder: 'desc',
                }),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                first.result.current.isSuccess,
            ).toBe(true),
        )

        await waitFor(() =>
            expect(
                second.result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            queryClient.getQueryCache().getAll(),
        ).toHaveLength(2)

        queryClient.clear()
    })

    it('loads additional infinite book pages with chained skip values', async () => {
        const firstPage: BookList = {
            items: Array.from(
                {
                    length: 30,
                },
                (_, index) => ({
                    id: `book-${index}`,
                }),
            ) as BookList['items'],
            total: 65,
        }

        const secondPage: BookList = {
            items: Array.from(
                {
                    length: 30,
                },
                (_, index) => ({
                    id: `book-${index + 30}`,
                }),
            ) as BookList['items'],
            total: 65,
        }

        mockList.mockReset()
        mockList.mockImplementation(
            async (options) => {
                if (options.skip === 0) {
                    return firstPage
                }

                if (options.skip === 30) {
                    return secondPage
                }

                throw new Error(
                    `Unexpected books list skip: ${String(options.skip)}`,
                )
            },
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () =>
                useInfiniteBooks({
                    shelfName: 'h5',
                    isRead: true,
                    sortBy: 'author',
                    sortOrder: 'asc',
                }),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        await waitFor(() =>
            expect(
                result.current.hasNextPage,
            ).toBe(true),
        )

        const fetchResult =
            await result.current.fetchNextPage()

        expect(fetchResult.isError).toBe(false)

        expect(
            fetchResult.data?.pages,
        ).toHaveLength(2)

        expect(
            mockList.mock.calls.some(
                ([options]) =>
                    options.skip === 30,
            ),
        ).toBe(true)

        expect(mockList).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 0,
                take: 30,
                sortBy: 'author',
                sortOrder: 'asc',
                shelfName: 'h5',
                isRead: true,
            }),
        )

        expect(mockList).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 30,
                take: 30,
                sortBy: 'author',
                sortOrder: 'asc',
            }),
        )

        expect(
            fetchResult.hasNextPage,
        ).toBe(true)

        queryClient.clear()
    })

    it('stops infinite book pagination when all items are loaded', async () => {
        mockList.mockReset()
        mockList.mockResolvedValue({
            items: Array.from(
                {
                    length: 5,
                },
                (_, index) => ({
                    id: `book-${index}`,
                }),
            ) as BookList['items'],
            total: 5,
        })

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useInfiniteBooks(),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                result.current.isSuccess,
            ).toBe(true),
        )

        await waitFor(() =>
            expect(
                result.current.hasNextPage,
            ).toBe(false),
        )

        queryClient.clear()
    })

    it('uses distinct infinite query keys per sort variant', async () => {
        mockList.mockResolvedValue({
            items: [],
            total: 0,
        })

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const first = renderHook(
            () =>
                useInfiniteBooks({
                    sortBy: 'author',
                    sortOrder: 'asc',
                }),
            {
                wrapper: Wrapper,
            },
        )

        const second = renderHook(
            () =>
                useInfiniteBooks({
                    sortBy: 'title',
                    sortOrder: 'desc',
                }),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                first.result.current.isSuccess,
            ).toBe(true),
        )

        await waitFor(() =>
            expect(
                second.result.current.isSuccess,
            ).toBe(true),
        )

        expect(
            queryClient.getQueryCache().getAll(),
        ).toHaveLength(2)

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
            expect.objectContaining({
                signal: expect.any(
                    AbortSignal,
                ),
            }),
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
            expect.objectContaining({
                signal: expect.any(
                    AbortSignal,
                ),
            }),
        )

        expect(
            result.current.data,
        ).toEqual(lookup)

        queryClient.clear()
    })

    it('creates a book and writes detail cache before invalidation', async () => {
        const bookInput =
            {} as BookCreate

        const createdBook = {
            id: 'book-123',
        } as BookRead

        mockCreate.mockResolvedValueOnce(
            createdBook,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const setQueryData =
            vi.spyOn(
                queryClient,
                'setQueryData',
            )

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
            setQueryData,
        ).toHaveBeenCalledWith(
            ['books', 'book-123'],
            createdBook,
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
    })


it(
    'updates a book and writes the returned BookRead into detail cache',
    async () => {
        const bookInput =
            {} as BookUpdate

        const updatedBook = {
            id: 'book-123',
            title: 'Updated',
        } as BookRead

        mockUpdate.mockResolvedValueOnce(
            updatedBook,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const setQueryData =
            vi.spyOn(
                queryClient,
                'setQueryData',
            )

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
            setQueryData,
        ).toHaveBeenCalledWith(
            ['books', 'book-123'],
            updatedBook,
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
        'bulk moves books and invalidates affected caches',
        async () => {
            const request: BulkShelfMoveRequest = {
                book_ids: [
                    'book-1',
                    'book-2',
                ],
                shelf_name: 'a1',
            }

            const response: BulkShelfMoveResponse = {
                book_ids: [
                    'book-1',
                    'book-2',
                ],
                moved_count: 2,
                shelf_name: 'a1',
            }

            mockMoveToShelf.mockResolvedValueOnce(
                response,
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
                    () =>
                        useBulkMoveBooksToShelf(),
                    {
                        wrapper: Wrapper,
                    },
                )

            const resultResponse =
                await result.current.mutateAsync(
                    request,
                )

            expect(
                mockMoveToShelf,
            ).toHaveBeenCalledWith(request)

            expect(resultResponse).toEqual(response)

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
                    'book-1',
                ],
            })

            expect(
                invalidateQueries,
            ).toHaveBeenCalledWith({
                queryKey: [
                    'books',
                    'book-2',
                ],
            })

            expect(
                invalidateQueries,
            ).toHaveBeenCalledWith({
                queryKey: ['shelves'],
            })

            expect(
                invalidateQueries,
            ).toHaveBeenCalledWith({
                queryKey: ['dashboard'],
            })

            expect(
                invalidateQueries,
            ).toHaveBeenCalledWith({
                queryKey: ['collections'],
            })

            queryClient.clear()
        },
    )

    it(
        'bulk moves books and invalidates affected caches',
        async () => {
            const request: BulkShelfMoveRequest = {
                book_ids: [
                    'book-1',
                    'book-2',
                ],
                shelf_name: 'a1',
            }

            const response: BulkShelfMoveResponse = {
                book_ids: [
                    'book-1',
                    'book-2',
                ],
                moved_count: 2,
                shelf_name: 'a1',
            }

            mockMoveToShelf.mockResolvedValueOnce(
                response,
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
                    () =>
                        useBulkMoveBooksToShelf(),
                    {
                        wrapper: Wrapper,
                    },
                )

            const resultResponse =
                await result.current.mutateAsync(
                    request,
                )

            expect(
                mockMoveToShelf,
            ).toHaveBeenCalledWith(request)

            expect(resultResponse).toEqual(response)

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
                    'book-1',
                ],
            })

            expect(
                invalidateQueries,
            ).toHaveBeenCalledWith({
                queryKey: [
                    'books',
                    'book-2',
                ],
            })

            expect(
                invalidateQueries,
            ).toHaveBeenCalledWith({
                queryKey: ['shelves'],
            })

            expect(
                invalidateQueries,
            ).toHaveBeenCalledWith({
                queryKey: ['dashboard'],
            })

            expect(
                invalidateQueries,
            ).toHaveBeenCalledWith({
                queryKey: ['collections'],
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

        expect(
            invalidateQueries,
        ).toHaveBeenCalledWith({
            queryKey: ['collections'],
        })

        queryClient.clear()
    },
)

it(
    'checks out a book, writes detail cache, and invalidates loans and dashboard',
    async () => {
        const request =
            {} as CheckoutRequest

        const book = {
            id: 'book-123',
            status: 'available',
        } as BookRead

        mockCheckout.mockResolvedValueOnce(
            book,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const setQueryData =
            vi.spyOn(
                queryClient,
                'setQueryData',
            )

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
            setQueryData,
        ).toHaveBeenCalledWith(
            ['books', 'book-123'],
            book,
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
    'checks in a book, writes detail cache, and invalidates loans and dashboard',
    async () => {
        const request =
            {} as CheckinRequest

        const book = {
            id: 'book-123',
        } as BookRead

        mockCheckin.mockResolvedValueOnce(
            book,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const setQueryData =
            vi.spyOn(
                queryClient,
                'setQueryData',
            )

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
            setQueryData,
        ).toHaveBeenCalledWith(
            ['books', 'book-123'],
            book,
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
    'marks a book as read, writes detail cache, and invalidates book and dashboard caches',
    async () => {
        const request =
            {} as MarkReadRequest

        const book = {
            id: 'book-123',
        } as BookRead

        mockMarkRead.mockResolvedValueOnce(
            book,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const setQueryData =
            vi.spyOn(
                queryClient,
                'setQueryData',
            )

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
            setQueryData,
        ).toHaveBeenCalledWith(
            ['books', 'book-123'],
            book,
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

    it('loads a book cover through the books API', async () => {
        const blob = new Blob(
            ['cover-image'],
            {
                type: 'image/jpeg',
            },
        )

        mockGetCover.mockResolvedValueOnce(blob)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () => useBookCover('book-123'),
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
            mockGetCover,
        ).toHaveBeenCalledWith(
            'book-123',
            {
                signal: expect.any(AbortSignal),
            },
        )

        expect(result.current.data).toBe(blob)

        expect(
            queryClient.getQueryData(
                [
                    'book-covers',
                    'book-123',
                ],
            ),
        ).toBe(blob)

        queryClient.clear()
    })

    it('retries a transient cover failure after remount', async () => {
        const unavailable = new ApiError({
            kind: 'server',
            status: 503,
            message:
                'Database is temporarily unavailable',
        })
        const blob = new Blob(
            ['cover-image'],
            {
                type: 'image/jpeg',
            },
        )

        mockGetCover
            .mockRejectedValueOnce(unavailable)
            .mockResolvedValueOnce(blob)

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const firstMount = renderHook(
            () => useBookCover('book-123'),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                firstMount.result.current
                    .isError,
            ).toBe(true),
        )

        expect(
            firstMount.result.current.error,
        ).toBe(unavailable)
        expect(
            queryClient.getQueryData([
                'book-covers',
                'book-123',
            ]),
        ).toBeUndefined()

        firstMount.unmount()

        const secondMount = renderHook(
            () => useBookCover('book-123'),
            {
                wrapper: Wrapper,
            },
        )

        await waitFor(() =>
            expect(
                secondMount.result.current
                    .isSuccess,
            ).toBe(true),
        )

        expect(mockGetCover).toHaveBeenCalledTimes(2)
        expect(
            secondMount.result.current.data,
        ).toBe(blob)

        secondMount.unmount()
        queryClient.clear()
    })

    it('uploads a cover and invalidates book and cover caches', async () => {
        const file = new File(
            ['cover-image'],
            'cover.webp',
            {
                type: 'image/webp',
            },
        )

        const book = {
            id: 'book-123',
            cover_image_path:
                'book-123.webp',
        } as BookRead

        mockUploadCover.mockResolvedValueOnce(
            book,
        )

        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const setQueryData =
            vi.spyOn(
                queryClient,
                'setQueryData',
            )

        const invalidateQueries =
            vi.spyOn(
                queryClient,
                'invalidateQueries',
            )

        const { result } = renderHook(
            () => useUploadBookCover(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync({
            id: 'book-123',
            file,
        })

        expect(
            mockUploadCover,
        ).toHaveBeenCalledWith(
            'book-123',
            file,
        )

        expect(
            setQueryData,
        ).toHaveBeenCalledWith(
            [
                'books',
                'book-123',
            ],
            book,
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
                'book-covers',
                'book-123',
            ],
        })

        queryClient.clear()
    })

    it('removes a cover and invalidates book and cover caches', async () => {
        mockRemoveCover.mockResolvedValueOnce(
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

        const { result } = renderHook(
            () => useRemoveBookCover(),
            {
                wrapper: Wrapper,
            },
        )

        await result.current.mutateAsync(
            'book-123',
        )

        expect(
            mockRemoveCover,
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
                'book-covers',
                'book-123',
            ],
        })

        queryClient.clear()
    })

    it('does not load a book cover while disabled', () => {
        const {
            Wrapper,
            queryClient,
        } = createWrapper()

        const { result } = renderHook(
            () =>
                useBookCover(
                    'book-123',
                    {
                        enabled: false,
                    },
                ),
            {
                wrapper: Wrapper,
            },
        )

        expect(result.current.fetchStatus).toBe(
            'idle',
        )

        expect(
            mockGetCover,
        ).not.toHaveBeenCalled()

        queryClient.clear()
    })

})
