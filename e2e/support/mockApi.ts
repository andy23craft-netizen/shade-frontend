import type { Page, Route } from '@playwright/test'
import type {
    BookRead,
    DashboardSummary,
    LoanRead,
    ShelfRead,
} from '../../src/api/apiTypes'

const NOW = '2026-08-16T12:00:00.000Z'
const RECENT_WINDOW_DAYS = 30

interface JsonResponseOptions {
    status?: number
    body: unknown
}

export interface MockApiRequest {
    method: string
    pathname: string
    search: string
    body: unknown
}

export interface MockApiState {
    books: BookRead[]
    loans: LoanRead[]
    shelves: ShelfRead[]
    requests: MockApiRequest[]
}

export interface MockApiController {
    state: MockApiState
}

export type DashboardFixture = DashboardSummary

export const emptyDashboardFixture: DashboardFixture = {
    total_books: 0,
    checked_out: 0,
    read: 0,
    unread: 0,
    recently_added: 0,
    recent_window_days: RECENT_WINDOW_DAYS,
    borrowing: {
        active_loans: 0,
        lifetime_loans: 0,
        average_loan_days: null,
    },
    reading: {
        books_read: 0,
        books_unread: 0,
        average_rating: null,
    },
}

interface InstallMockApiOptions {
    dashboard?: DashboardFixture
    books?: BookRead[]
    loans?: LoanRead[]
    shelves?: ShelfRead[]
}

interface CheckoutBody {
    borrower?: string
    checked_out_at?: string
    due_at?: string | null
    notes?: string | null
}

interface CheckinBody {
    returned_at?: string
}

interface MarkReadBody {
    completion_date?: string | null
    rating?: number | null
    review?: string | null
}

async function fulfillJson(
    route: Route,
    {
        status = 200,
        body,
    }: JsonResponseOptions,
) {
    await route.fulfill({
        status,
        contentType: 'application/json',
        json: body,
    })
}

async function fulfillNoContent(
    route: Route,
) {
    await route.fulfill({
        status: 204,
        body: '',
    })
}

function readRequestBody(
    route: Route,
): Record<string, unknown> {
    const rawBody = route.request().postData()

    if (rawBody === null || rawBody === '') {
        return {}
    }

    const parsed = JSON.parse(rawBody) as unknown

    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        return {}
    }

    return parsed as Record<string, unknown>
}

function cloneBook(
    book: BookRead,
): BookRead {
    return {
        ...book,
        tags: [...book.tags],
    }
}

function cloneLoan(
    loan: LoanRead,
): LoanRead {
    return {
        ...loan,
    }
}

export function makeBook(
    overrides: Partial<BookRead> = {},
): BookRead {
    return {
        id: 'e2e-book-1',
        title: 'Pale Fire',
        authors: 'Vladimir Nabokov',
        isbn13: '9780679723427',
        category: 'fiction',
        shelf_name: 'a1',
        status: 'available',
        publication_date: '1962',
        publisher: 'Vintage',
        pages: 315,
        acquisition_source: null,
        purchase_date: null,
        purchase_price: null,
        is_read: false,
        completion_date: null,
        rating: null,
        review: null,
        notes: null,
        tags: [],
        last_borrowed_at: null,
        times_borrowed: 0,
        average_loan_days: null,
        creation_date: NOW,
        updated_date: NOW,
        deletion_date: null,
        ...overrides,
    }
}

export function makeLoan(
    overrides: Partial<LoanRead> = {},
): LoanRead {
    return {
        id: 'e2e-loan-1',
        book_id: 'e2e-book-1',
        borrower: 'Jane Reader',
        checked_out_at: NOW,
        due_at: null,
        returned_at: null,
        notes: null,
        ...overrides,
    }
}

export const lifecycleShelf: ShelfRead = {
    shelf_id: 'shelf-a1',
    common_name: 'a1',
    location: 'Living room',
    description: null,
    created_date: '2026-01-01T00:00:00Z',
    updated_date: '2026-01-01T00:00:00Z',
}

function findBook(
    state: MockApiState,
    id: string,
) {
    return state.books.find(
        (book) => book.id === id,
    )
}

function findActiveLoan(
    state: MockApiState,
    bookId: string,
) {
    return state.loans.find(
        (loan) =>
            loan.book_id === bookId &&
            loan.returned_at === null,
    )
}

function listBooks(
    state: MockApiState,
    url: URL,
) {
    const includeDeleted =
        url.searchParams.get('include_deleted') === 'true'
    const isbn = url.searchParams.get('isbn')
    const author = url.searchParams.get('author')
    const title = url.searchParams.get('title')
    const category = url.searchParams.get('category')
    const sortBy = url.searchParams.get('sortBy')
    const sortOrder =
        url.searchParams.get('sortOrder') === 'desc'
            ? -1
            : 1

    let books = state.books.filter(
        (book) =>
            includeDeleted ||
            book.deletion_date === null,
    )

    if (isbn !== null) {
        books = books.filter(
            (book) => book.isbn13 === isbn,
        )
    }

    if (author !== null) {
        const needle = author.toLowerCase()

        books = books.filter(
            (book) =>
                book.authors
                    .toLowerCase()
                    .includes(needle),
        )
    }

    if (title !== null) {
        const needle = title.toLowerCase()

        books = books.filter(
            (book) =>
                book.title
                    .toLowerCase()
                    .includes(needle),
        )
    }

    if (category !== null) {
        books = books.filter(
            (book) => book.category === category,
        )
    }

    if (sortBy !== null) {
        books = [...books].sort((left, right) => {
            let leftValue = ''
            let rightValue = ''

            switch (sortBy) {
                case 'author':
                    leftValue = left.authors
                    rightValue = right.authors
                    break

                case 'title':
                    leftValue = left.title
                    rightValue = right.title
                    break

                case 'creationDate':
                    leftValue = left.creation_date
                    rightValue = right.creation_date
                    break

                case 'shelf':
                    leftValue = left.shelf_name
                    rightValue = right.shelf_name
                    break
            }

            return (
                leftValue.localeCompare(
                    rightValue,
                ) * sortOrder
            )
        })
    }

    const total = books.length
    const skip = Number(
        url.searchParams.get('skip') ?? 0,
    )
    const takeParam =
        url.searchParams.get('take')

    if (takeParam !== null) {
        const take = Number(takeParam)

        books = books.slice(
            skip,
            skip + take,
        )
    } else if (skip > 0) {
        books = books.slice(skip)
    }

    return {
        items: books.map(cloneBook),
        total,
    }
}

function listLoans(
    state: MockApiState,
    url: URL,
) {
    const bookId =
        url.searchParams.get('book_id')

    let loans =
        bookId === null
            ? [...state.loans]
            : state.loans.filter(
                (loan) =>
                    loan.book_id === bookId,
            )

    const total = loans.length
    const skip = Number(
        url.searchParams.get('skip') ?? 0,
    )
    const takeParam =
        url.searchParams.get('take')

    if (takeParam !== null) {
        const take = Number(takeParam)

        loans = loans.slice(
            skip,
            skip + take,
        )
    } else if (skip > 0) {
        loans = loans.slice(skip)
    }

    return {
        items: loans.map(cloneLoan),
        total,
    }
}

function average(
    values: number[],
): number | null {
    if (values.length === 0) {
        return null
    }

    return (
        values.reduce(
            (sum, value) => sum + value,
            0,
        ) / values.length
    )
}

function calculateDashboard(
    state: MockApiState,
): DashboardSummary {
    const activeBooks = state.books.filter(
        (book) => book.deletion_date === null,
    )

    const activeBookIds = new Set(
        activeBooks.map((book) => book.id),
    )

    const visibleLoans = state.loans.filter(
        (loan) =>
            activeBookIds.has(loan.book_id),
    )

    const returnedLoanDays =
        visibleLoans.flatMap((loan) => {
            if (loan.returned_at === null) {
                return []
            }

            const checkedOut =
                Date.parse(loan.checked_out_at)
            const returned =
                Date.parse(loan.returned_at)

            if (
                Number.isNaN(checkedOut) ||
                Number.isNaN(returned)
            ) {
                return []
            }

            return [
                (returned - checkedOut) /
                86_400_000,
            ]
        })

    const ratings = activeBooks.flatMap(
        (book) =>
            book.rating === null
                ? []
                : [book.rating],
    )

    const recentCutoff =
        Date.parse(NOW) -
        RECENT_WINDOW_DAYS *
        86_400_000

    const recentlyAdded =
        activeBooks.filter((book) => {
            const created =
                Date.parse(book.creation_date)

            return (
                !Number.isNaN(created) &&
                created >= recentCutoff
            )
        }).length

    const booksRead =
        activeBooks.filter(
            (book) => book.is_read,
        ).length

    const booksUnread =
        activeBooks.length - booksRead

    return {
        total_books: activeBooks.length,
        checked_out: activeBooks.filter(
            (book) =>
                book.status === 'on_loan',
        ).length,
        read: booksRead,
        unread: booksUnread,
        recently_added: recentlyAdded,
        recent_window_days:
        RECENT_WINDOW_DAYS,
        borrowing: {
            active_loans:
            visibleLoans.filter(
                (loan) =>
                    loan.returned_at ===
                    null,
            ).length,
            lifetime_loans:
            visibleLoans.length,
            average_loan_days:
                average(returnedLoanDays),
        },
        reading: {
            books_read: booksRead,
            books_unread: booksUnread,
            average_rating:
                average(ratings),
        },
    }
}

function createBookFromRequest(
    state: MockApiState,
    body: Record<string, unknown>,
): BookRead {
    const nextId =
        `e2e-book-${state.books.length + 1}`

    const book = makeBook({
        id: nextId,
        title:
            typeof body.title === 'string'
                ? body.title
                : '',
        authors:
            typeof body.authors === 'string'
                ? body.authors
                : '',
        isbn13:
            typeof body.isbn13 === 'string'
                ? body.isbn13
                : null,
        category:
            typeof body.category === 'string'
                ? body.category as BookRead['category']
                : 'unknown',
        shelf_name:
            typeof body.shelf_name === 'string'
                ? body.shelf_name
                : 'unknown',
        publication_date:
            typeof body.publication_date === 'string'
                ? body.publication_date
                : null,
        publisher:
            typeof body.publisher === 'string'
                ? body.publisher
                : null,
        pages:
            typeof body.pages === 'number'
                ? body.pages
                : null,
        acquisition_source:
            typeof body.acquisition_source === 'string'
                ? body.acquisition_source
                : null,
        purchase_date:
            typeof body.purchase_date === 'string'
                ? body.purchase_date
                : null,
        purchase_price:
            typeof body.purchase_price === 'number'
                ? body.purchase_price
                : null,
        notes:
            typeof body.notes === 'string'
                ? body.notes
                : null,
        tags:
            Array.isArray(body.tags)
                ? body.tags.filter(
                    (tag): tag is string =>
                        typeof tag === 'string',
                )
                : [],
        status: 'available',
        is_read: false,
        completion_date: null,
        rating: null,
        review: null,
        last_borrowed_at: null,
        times_borrowed: 0,
        average_loan_days: null,
        creation_date: NOW,
        updated_date: NOW,
        deletion_date: null,
    })

    state.books.push(book)

    return cloneBook(book)
}

function updateBookFromRequest(
    book: BookRead,
    body: Record<string, unknown>,
) {
    Object.assign(
        book,
        body as Partial<BookRead>,
        {
            updated_date: NOW,
        },
    )
}

function recordRequest(
    state: MockApiState,
    route: Route,
    url: URL,
) {
    const request = route.request()
    const rawBody = request.postData()

    let body: unknown = null

    if (rawBody !== null) {
        try {
            body = JSON.parse(rawBody) as unknown
        } catch {
            body = rawBody
        }
    }

    state.requests.push({
        method: request.method(),
        pathname: url.pathname,
        search: url.search,
        body,
    })
}

export async function installMockApi(
    page: Page,
    {
        dashboard,
        books = [],
        loans = [],
        shelves = [lifecycleShelf],
    }: InstallMockApiOptions = {},
): Promise<MockApiController> {
    const state: MockApiState = {
        books: books.map(cloneBook),
        loans: loans.map(cloneLoan),
        shelves: shelves.map((shelf) => ({
            ...shelf,
        })),
        requests: [],
    }

    await page.route(
        'http://127.0.0.1:8000/**',
        async (route) => {
            const request = route.request()
            const method = request.method()
            const url = new URL(
                request.url(),
            )

            recordRequest(
                state,
                route,
                url,
            )

            if (
                method === 'GET' &&
                url.pathname === '/health'
            ) {
                await fulfillJson(route, {
                    body: {
                        status: 'ok',
                    },
                })
                return
            }

            if (
                method === 'GET' &&
                url.pathname === '/shelves'
            ) {
                await fulfillJson(route, {
                    body: state.shelves,
                })
                return
            }

            if (
                method === 'GET' &&
                url.pathname === '/version'
            ) {
                await fulfillJson(route, {
                    body: {
                        version: '0.2.1',
                    },
                })
                return
            }

            if (
                method === 'GET' &&
                url.pathname === '/dashboard'
            ) {
                await fulfillJson(route, {
                    body:
                        dashboard ??
                        calculateDashboard(
                            state,
                        ),
                })
                return
            }

            if (
                method === 'GET' &&
                url.pathname === '/books'
            ) {
                await fulfillJson(route, {
                    body: listBooks(
                        state,
                        url,
                    ),
                })
                return
            }

            if (
                method === 'POST' &&
                url.pathname === '/books'
            ) {
                const book =
                    createBookFromRequest(
                        state,
                        readRequestBody(
                            route,
                        ),
                    )

                await fulfillJson(route, {
                    status: 201,
                    body: book,
                })
                return
            }

            if (
                method === 'GET' &&
                url.pathname ===
                '/books/lookup'
            ) {
                await fulfillJson(route, {
                    body: {
                        found: false,
                        draft: null,
                    },
                })
                return
            }

            if (
                method === 'GET' &&
                url.pathname === '/loans'
            ) {
                await fulfillJson(route, {
                    body: listLoans(
                        state,
                        url,
                    ),
                })
                return
            }

            const loanDetailMatch =
                url.pathname.match(
                    /^\/loans\/([^/]+)$/,
                )

            if (
                method === 'GET' &&
                loanDetailMatch
            ) {
                const id =
                    decodeURIComponent(
                        loanDetailMatch[1],
                    )

                const loan =
                    state.loans.find(
                        (candidate) =>
                            candidate.id === id,
                    )

                if (!loan) {
                    await fulfillJson(route, {
                        status: 404,
                        body: {
                            detail:
                                'Loan not found',
                        },
                    })
                    return
                }

                await fulfillJson(route, {
                    body: cloneLoan(loan),
                })
                return
            }

            const restoreMatch =
                url.pathname.match(
                    /^\/books\/([^/]+)\/restore$/,
                )

            if (
                method === 'POST' &&
                restoreMatch
            ) {
                const id =
                    decodeURIComponent(
                        restoreMatch[1],
                    )
                const book =
                    findBook(state, id)

                if (!book) {
                    await fulfillJson(route, {
                        status: 404,
                        body: {
                            detail:
                                'Book not found',
                        },
                    })
                    return
                }

                if (
                    book.deletion_date ===
                    null
                ) {
                    await fulfillJson(route, {
                        status: 409,
                        body: {
                            detail:
                                'Book is not deleted',
                        },
                    })
                    return
                }

                book.deletion_date = null
                book.updated_date = NOW

                await fulfillJson(route, {
                    body: cloneBook(book),
                })
                return
            }

            const checkoutMatch =
                url.pathname.match(
                    /^\/books\/([^/]+)\/checkout$/,
                )

            if (
                method === 'POST' &&
                checkoutMatch
            ) {
                const id =
                    decodeURIComponent(
                        checkoutMatch[1],
                    )
                const book =
                    findBook(state, id)

                if (
                    !book ||
                    book.deletion_date !==
                    null
                ) {
                    await fulfillJson(route, {
                        status: 404,
                        body: {
                            detail:
                                'Book not found',
                        },
                    })
                    return
                }

                if (
                    book.status ===
                    'display_only'
                ) {
                    await fulfillJson(route, {
                        status: 412,
                        body: {
                            detail:
                                'Book is display only',
                        },
                    })
                    return
                }

                if (
                    book.status ===
                    'on_loan' ||
                    findActiveLoan(
                        state,
                        id,
                    )
                ) {
                    await fulfillJson(route, {
                        status: 409,
                        body: {
                            detail:
                                'Book is already checked out',
                        },
                    })
                    return
                }

                const body =
                    readRequestBody(
                        route,
                    ) as CheckoutBody

                const checkedOutAt =
                    body.checked_out_at ??
                    NOW

                const loan = makeLoan({
                    id: `e2e-loan-${state.loans.length + 1}`,
                    book_id: id,
                    borrower:
                        body.borrower ??
                        'Jane Reader',
                    checked_out_at:
                    checkedOutAt,
                    due_at:
                        body.due_at ?? null,
                    returned_at: null,
                    notes:
                        body.notes ?? null,
                })

                state.loans.push(loan)

                book.status = 'on_loan'
                book.last_borrowed_at =
                    checkedOutAt
                book.times_borrowed += 1
                book.updated_date = NOW

                await fulfillJson(route, {
                    body: cloneBook(book),
                })
                return
            }

            const checkinMatch =
                url.pathname.match(
                    /^\/books\/([^/]+)\/checkin$/,
                )

            if (
                method === 'POST' &&
                checkinMatch
            ) {
                const id =
                    decodeURIComponent(
                        checkinMatch[1],
                    )
                const book =
                    findBook(state, id)

                if (
                    !book ||
                    book.deletion_date !==
                    null
                ) {
                    await fulfillJson(route, {
                        status: 404,
                        body: {
                            detail:
                                'Book not found',
                        },
                    })
                    return
                }

                const loan =
                    findActiveLoan(
                        state,
                        id,
                    )

                if (!loan) {
                    await fulfillJson(route, {
                        status: 409,
                        body: {
                            detail:
                                'Book is not checked out',
                        },
                    })
                    return
                }

                const body =
                    readRequestBody(
                        route,
                    ) as CheckinBody

                const returnedAt =
                    body.returned_at ?? NOW

                loan.returned_at =
                    returnedAt

                book.status = 'available'
                book.updated_date = NOW

                const checkedOut =
                    Date.parse(
                        loan.checked_out_at,
                    )
                const returned =
                    Date.parse(returnedAt)

                if (
                    !Number.isNaN(
                        checkedOut,
                    ) &&
                    !Number.isNaN(returned)
                ) {
                    book.average_loan_days =
                        (returned -
                            checkedOut) /
                        86_400_000
                }

                await fulfillJson(route, {
                    body: cloneBook(book),
                })
                return
            }

            const markReadMatch =
                url.pathname.match(
                    /^\/books\/([^/]+)\/mark-read$/,
                )

            if (
                method === 'POST' &&
                markReadMatch
            ) {
                const id =
                    decodeURIComponent(
                        markReadMatch[1],
                    )
                const book =
                    findBook(state, id)

                if (
                    !book ||
                    book.deletion_date !==
                    null
                ) {
                    await fulfillJson(route, {
                        status: 404,
                        body: {
                            detail:
                                'Book not found',
                        },
                    })
                    return
                }

                const body =
                    readRequestBody(
                        route,
                    ) as MarkReadBody

                book.is_read = true

                if (
                    'completion_date' in
                    body
                ) {
                    book.completion_date =
                        body.completion_date ??
                        null
                }

                if ('rating' in body) {
                    book.rating =
                        body.rating ?? null
                }

                if ('review' in body) {
                    book.review =
                        body.review ?? null
                }

                book.updated_date = NOW

                await fulfillJson(route, {
                    body: cloneBook(book),
                })
                return
            }

            const bookMatch =
                url.pathname.match(
                    /^\/books\/([^/]+)$/,
                )

            if (bookMatch) {
                const id =
                    decodeURIComponent(
                        bookMatch[1],
                    )
                const book =
                    findBook(state, id)

                if (!book) {
                    await fulfillJson(route, {
                        status: 404,
                        body: {
                            detail:
                                'Book not found',
                        },
                    })
                    return
                }

                if (method === 'GET') {
                    await fulfillJson(route, {
                        body: cloneBook(book),
                    })
                    return
                }

                if (method === 'PATCH') {
                    updateBookFromRequest(
                        book,
                        readRequestBody(
                            route,
                        ),
                    )

                    await fulfillJson(route, {
                        body: cloneBook(book),
                    })
                    return
                }

                if (method === 'DELETE') {
                    if (
                        book.deletion_date !==
                        null
                    ) {
                        await fulfillJson(
                            route,
                            {
                                status: 404,
                                body: {
                                    detail:
                                        'Book already deleted',
                                },
                            },
                        )
                        return
                    }

                    book.deletion_date = NOW
                    book.updated_date = NOW

                    await fulfillNoContent(
                        route,
                    )
                    return
                }
            }

            await fulfillJson(route, {
                status: 404,
                body: {
                    detail: 'Not found',
                },
            })
        },
    )

    return {
        state,
    }
}
