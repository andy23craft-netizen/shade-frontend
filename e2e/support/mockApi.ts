import type { Page, Route } from '@playwright/test'
import type {
    AuthorRead,
    BookCategoryRead,
    BookRead,
    CategoryRead,
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
    categories: CategoryRead[]
    authors: AuthorRead[]
    requests: MockApiRequest[]
}

export interface MockApiController {
    state: MockApiState
}

export type DashboardFixture = DashboardSummary

export const emptyDashboardFixture: DashboardFixture = {
    total_albums: 0,
    albums_checked_out: 0,
    albums_recently_added: 0,
    album_borrowing: {
        active_loans: 0,
        lifetime_loans: 0,
        average_loan_days: null,
    },
    listening: {
        albums_played: 0,
        albums_unplayed: 0,
        average_rating: null,
    },
    stash_count: 0,
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
    categories?: CategoryRead[]
    authors?: AuthorRead[]
}

interface CheckoutBody {
    borrower?: string
    checked_out_at?: string
    due_at?: string | null
    notes?: string | null
}

interface CheckinBody {
    rating?: number
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
        authors: book.authors
            ? book.authors.map((author) => ({
                ...author,
            }))
            : book.authors,
        tags: book.tags ? [...book.tags] : book.tags,
        categories: book.categories
            ? [...book.categories]
            : book.categories,
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
        book_id: 'e2e-book-1',
        title: 'Pale Fire',
        authors: [
            {
                author_id: 'author-nabokov',
                first_name: 'Vladimir',
                surname: 'Nabokov',
            },
        ],
        isbn13: '9780679723427',
        categories: [
            {
                category_id: 'cat-fiction',
                name: 'Fiction',
                slug: 'fiction',
            },
        ],
        shelf_name: 'a1',
        placement_state: 'shelved',
        previous_shelf_name: null,
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
        ...overrides,
    }
}

export function makeLoan(
    overrides: Partial<LoanRead> = {},
): LoanRead {
    return {
        album_id: null,
        id: 'e2e-loan-1',
        book_id: 'e2e-book-1',
        created_date: NOW,
        last_updated_date: NOW,
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

export const lifecycleCategories: CategoryRead[] = [
    {
        category_id: 'cat-fiction',
        name: 'Fiction',
        slug: 'fiction',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        category_id: 'cat-nonfiction',
        name: 'Nonfiction',
        slug: 'nonfiction',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

export const lifecycleAuthors: AuthorRead[] = [
    {
        author_id: 'author-nabokov',
        first_name: 'Vladimir',
        surname: 'Nabokov',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        author_id: 'author-le-guin',
        first_name: 'Ursula K.',
        surname: 'Le Guin',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

function bookAuthorNames(
    book: BookRead,
): string {
    return (book.authors ?? [])
        .map((author) =>
            [
                author.first_name,
                author.surname,
            ]
                .filter(Boolean)
                .join(' '),
        )
        .join(', ')
}
function findBook(
    state: MockApiState,
    id: string,
) {
    return state.books.find(
        (book) => book.book_id === id,
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
    const isbn = url.searchParams.get('isbn')
    const author = url.searchParams.get('author')
    const title = url.searchParams.get('title')
    const categoryIds = url.searchParams
        .getAll('category_id')
        .map((value) => value.trim())
        .filter((value) => value !== '')
    const shelfName = url.searchParams.get('shelf_name')
    const placementState =
        url.searchParams.get('placement_state')
    const sortBy = url.searchParams.get('sortBy')
    const sortOrder =
        url.searchParams.get('sortOrder') === 'desc'
            ? -1
            : 1

    let books = [...state.books]

    if (isbn !== null) {
        books = books.filter(
            (book) => book.isbn13 === isbn,
        )
    }

    if (author !== null) {
        const needle = author.toLowerCase()

        books = books.filter((book) =>
            bookAuthorNames(book)
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

    if (categoryIds.length > 0) {
        books = books.filter((book) => {
            const bookCategoryIds = new Set(
                (book.categories ?? []).map(
                    (category) =>
                        category.category_id,
                ),
            )

            return categoryIds.every((categoryId) =>
                bookCategoryIds.has(categoryId),
            )
        })
    }

    if (shelfName !== null) {
        books = books.filter(
            (book) => book.shelf_name === shelfName,
        )
    }

    if (placementState !== null) {
        books = books.filter(
            (book) =>
                book.placement_state === placementState,
        )
    } else {
        books = books.filter(
            (book) => book.placement_state === 'shelved',
        )
    }

    if (sortBy !== null) {
        books = [...books].sort((left, right) => {
            let leftValue = ''
            let rightValue = ''

            switch (sortBy) {
                case 'author':
                    leftValue = bookAuthorNames(left)
                    rightValue = bookAuthorNames(right)
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
                    leftValue = left.shelf_name ?? ''
                    rightValue = right.shelf_name ?? ''
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

    const albumId = url.searchParams.get('album_id')
    const mediaType = url.searchParams.get('media_type')
    loans = loans.filter((loan) =>
        (albumId === null || loan.album_id === albumId) &&
        (mediaType !== 'book' || loan.book_id !== null) &&
        (mediaType !== 'album' || loan.album_id !== null),
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
    const activeBooks = state.books

    const activeBookIds = new Set(
        activeBooks.map((book) => book.book_id),
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
        total_albums: 0,
        albums_checked_out: 0,
        albums_recently_added: 0,
        album_borrowing: {
            active_loans: 0,
            lifetime_loans: 0,
            average_loan_days: null,
        },
        listening: {
            albums_played: 0,
            albums_unplayed: 0,
            average_rating: null,
        },
        stash_count: activeBooks.filter(
            (book) =>
                book.placement_state === 'stashed',
        ).length,
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

function resolveCategoriesFromIds(
    state: MockApiState,
    categoryIds: unknown,
): BookCategoryRead[] {
    if (!Array.isArray(categoryIds)) {
        return []
    }

    const resolved: BookCategoryRead[] = []

    for (const value of categoryIds) {
        if (typeof value !== 'string') {
            continue
        }

        const category = state.categories.find(
            (entry) =>
                entry.category_id === value,
        )

        if (category === undefined) {
            continue
        }

        resolved.push({
            category_id: category.category_id,
            name: category.name,
            slug: category.slug,
        })
    }

    return resolved
}

function resolveAuthorsFromIds(
    state: MockApiState,
    authorIds: unknown,
): BookRead['authors'] {
    if (!Array.isArray(authorIds)) {
        return []
    }

    return authorIds.flatMap((value) => {
        if (typeof value !== 'string') {
            return []
        }

        const author = state.authors.find(
            (entry) =>
                entry.author_id === value,
        )

        if (author === undefined) {
            return []
        }

        return [
            {
                author_id: author.author_id,
                first_name: author.first_name,
                surname: author.surname,
            },
        ]
    })
}

function createBookFromRequest(
    state: MockApiState,
    body: Record<string, unknown>,
): BookRead {
    const nextId =
        `e2e-book-${state.books.length + 1}`

    const book = makeBook({
        book_id: nextId,
        title:
            typeof body.title === 'string'
                ? body.title
                : '',
        authors: resolveAuthorsFromIds(
            state,
            body.author_ids,
        ),
        isbn13:
            typeof body.isbn13 === 'string'
                ? body.isbn13
                : null,
        categories: resolveCategoriesFromIds(
            state,
            body.category_ids,
        ),
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
    })

    state.books.push(book)

    return cloneBook(book)
}

function updateBookFromRequest(
    state: MockApiState,
    book: BookRead,
    body: Record<string, unknown>,
) {
    const {
        category_ids: categoryIds,
        ...rest
    } = body

    Object.assign(
        book,
        rest as Partial<BookRead>,
        {
            updated_date: NOW,
        },
    )

    if ('category_ids' in body) {
        book.categories = resolveCategoriesFromIds(
            state,
            categoryIds,
        )
    }
}

function removeBookFromState(
    state: MockApiState,
    id: string,
): void {
    state.books = state.books.filter(
        (book) => book.book_id !== id,
    )

    state.loans = state.loans.filter(
        (loan) => loan.book_id !== id,
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
        categories = lifecycleCategories,
        authors = lifecycleAuthors,
    }: InstallMockApiOptions = {},
): Promise<MockApiController> {
    const state: MockApiState = {
        books: books.map(cloneBook),
        loans: loans.map(cloneLoan),
        shelves: shelves.map((shelf) => ({
            ...shelf,
        })),
        categories: categories.map((category) => ({
            ...category,
        })),
        authors: authors.map((author) => ({
            ...author,
        })),
        requests: [],
    }

    const apiPathPattern =
        /^\/(?:api\/)?(?:health|ready|version|books|albums|artists|authors|genres|loans|dashboard|shelves|categories|docs|redoc|openapi\.json|wishlists|collections)(?:\/|$)/

    await page.route(
        (url) => apiPathPattern.test(url.pathname),
        async (route) => {
            const request = route.request()

            if (
                request.resourceType() !== 'fetch' &&
                request.resourceType() !== 'xhr'
            ) {
                await route.continue()
                return
            }

            const method = request.method()
            const url = new URL(
                request.url(),
            )

            if (url.pathname.startsWith('/api/')) {
                url.pathname = url.pathname.replace(
                    /^\/api/u,
                    '',
                )
            }

            recordRequest(
                state,
                route,
                url,
            )

            if (
                method === 'GET' &&
                (
                    url.pathname === '/health' ||
                    url.pathname === '/ready'
                )
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
                url.pathname === '/categories'
            ) {
                await fulfillJson(route, {
                    body: state.categories,
                })
                return
            }

            if (
                method === 'GET' &&
                url.pathname === '/authors'
            ) {
                await fulfillJson(route, {
                    body: {
                        items: state.authors,
                        total: state.authors.length,
                    },
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
                method === 'POST' &&
                url.pathname === '/books/bulk/stash'
            ) {
                const body = readRequestBody(route) as {
                    book_ids?: string[]
                }
                const selected = (body.book_ids ?? []).map(
                    (bookId) => findBook(state, bookId),
                )

                if (selected.some(
                    (book) =>
                        !book || book.placement_state !== 'shelved',
                )) {
                    await fulfillJson(route, {
                        status: 409,
                        body: { detail: 'One or more books are not shelved' },
                    })
                    return
                }

                const items = selected.map((book, index) => {
                    const previousShelfName = book?.shelf_name ?? 'unknown'

                    if (book) {
                        book.shelf_name = null
                        book.placement_state = 'stashed'
                        book.previous_shelf_name = previousShelfName
                    }

                    return {
                        book_id: body.book_ids?.[index] ?? '',
                        previous_shelf_name: previousShelfName,
                    }
                })

                await fulfillJson(route, {
                    body: {
                        book_ids: body.book_ids ?? [],
                        stashed_count: items.length,
                        items,
                    },
                })
                return
            }

            if (
                method === 'POST' &&
                url.pathname === '/books/bulk/apply-stash'
            ) {
                const body = readRequestBody(route) as {
                    book_ids?: string[]
                    shelf_name?: string
                }
                const destination = body.shelf_name ?? ''
                const preexisting = state.books.filter(
                    (book) =>
                        book.placement_state === 'shelved' &&
                        book.shelf_name === destination,
                ).length
                const selected = (body.book_ids ?? []).map(
                    (bookId) => findBook(state, bookId),
                )

                if (selected.some((book) => !book || book.placement_state !== 'stashed')) {
                    await fulfillJson(route, {
                        status: 409,
                        body: { detail: 'One or more books are not stashed' },
                    })
                    return
                }

                for (const book of selected) {
                    if (!book) continue
                    book.shelf_name = destination
                    book.placement_state = 'shelved'
                    book.previous_shelf_name = null
                }

                await fulfillJson(route, {
                    body: {
                        applied_count: selected.length,
                        book_ids: body.book_ids ?? [],
                        destination_shelf: destination,
                        destination_preexisting_count: preexisting,
                        destination_was_occupied: preexisting > 0,
                    },
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
                    album_id: null,
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

                if (!Number.isInteger(body.rating) || body.rating! < 1 || body.rating! > 5) {
                    await fulfillJson(route, {
                        status: 422,
                        body: { detail: 'Rating must be an integer from 1 through 5' },
                    })
                    return
                }

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
                        state,
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
                    removeBookFromState(
                        state,
                        id,
                    )

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
