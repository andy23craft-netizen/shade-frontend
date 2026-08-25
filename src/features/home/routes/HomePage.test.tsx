import {
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    BookList,
    CollectionBookList,
    CollectionList,
    DashboardBreakdowns,
} from '../../../api/apiTypes'
import {
    useRecentBooks,
} from '../../../api/booksQueries'
import {
    useCategories,
} from '../../../api/categoriesQueries'
import {
    useCollectionBooks,
    useCollections,
} from '../../../api/collectionsQueries'
import {
    useDashboardBreakdowns,
} from '../../../api/dashboardQueries'
import {
    mockReachableApi,
    renderAppTree,
} from '../../../test/renderAppTree'

const mockHomeStaffPick = vi.fn()

vi.mock('../../../api/booksQueries', async (importOriginal) => {
    const actual =
        await importOriginal<
            typeof import('../../../api/booksQueries')
        >()

    return {
        ...actual,
        useRecentBooks: vi.fn(),
    }
})

vi.mock('../../../api/categoriesQueries', () => ({
    useCategories: vi.fn(),
}))

vi.mock('../../../api/collectionsQueries', () => ({
    useCollections: vi.fn(),
    useCollectionBooks: vi.fn(),
}))

vi.mock('../../../api/dashboardQueries', async (importOriginal) => {
    const actual =
        await importOriginal<
            typeof import('../../../api/dashboardQueries')
        >()

    return {
        ...actual,
        useDashboardBreakdowns: vi.fn(),
    }
})

vi.mock(
    '../components/HomeStaffPick',
    () => ({
        HomeStaffPick: ({
                            bookId,
                        }: {
            bookId: string
        }) => {
            mockHomeStaffPick(bookId)

            return (
                <li data-testid="home-staff-pick">
                    {bookId}
                </li>
            )
        },
    }),
)

const mockUseRecentBooks =
    vi.mocked(useRecentBooks)

const mockUseCategories =
    vi.mocked(useCategories)

const mockUseCollections =
    vi.mocked(useCollections)

const mockUseCollectionBooks =
    vi.mocked(useCollectionBooks)

const mockUseDashboardBreakdowns =
    vi.mocked(useDashboardBreakdowns)

const breakdownsFixture: DashboardBreakdowns = {
    total_books: 100,
    on_loan: 4,
    by_category: [
        {
            key: 'Fantasy',
            count: 30,
        },
        {
            key: 'Religion',
            count: 25,
        },
        {
            key: 'History',
            count: 20,
        },
        {
            key: 'Philosophy',
            count: 15,
        },
        {
            key: 'Science',
            count: 10,
        },
        {
            key: 'Poetry',
            count: 5,
        },
    ],
    by_shelf: [],
    by_creation_year: [],
}

const categoriesFixture = [
    {
        category_id: 'cat-fantasy',
        name: 'Fantasy',
    },
    {
        category_id: 'cat-religion',
        name: 'Religion',
    },
    {
        category_id: 'cat-history',
        name: 'History',
    },
    {
        category_id: 'cat-philosophy',
        name: 'Philosophy',
    },
    {
        category_id: 'cat-science',
        name: 'Science',
    },
    {
        category_id: 'cat-poetry',
        name: 'Poetry',
    },
] as ReturnType<typeof useCategories>['data']

const collectionsFixture: CollectionList = {
    items: [
        {
            collection_id: 'collection-staff',
            name: 'Staff Picks',
            description: 'Books we recommend.',
            created_date:
                '2026-08-01T00:00:00Z',
            last_updated_date:
                '2026-08-20T00:00:00Z',
        },
        {
            collection_id: 'collection-other',
            name: 'Other Collection',
            description: null,
            created_date:
                '2026-08-01T00:00:00Z',
            last_updated_date:
                '2026-08-20T00:00:00Z',
        },
    ],
    total: 2,
}

const staffPicksFixture: CollectionBookList = {
    items: [
        {
            collection_book_id:
                'membership-shelved-1',
            collection_id:
                'collection-staff',
            book_id: 'book-staff-1',
            order_num: 1,
            notes: null,
            shelf_name: 'a1',
            on_wishlist: false,
            created_date:
                '2026-08-01T00:00:00Z',
        },
        {
            collection_book_id:
                'membership-wishlist',
            collection_id:
                'collection-staff',
            book_id: 'book-wishlist',
            order_num: 2,
            notes: null,
            shelf_name: null,
            on_wishlist: true,
            created_date:
                '2026-08-02T00:00:00Z',
        },
        {
            collection_book_id:
                'membership-shelved-2',
            collection_id:
                'collection-staff',
            book_id: 'book-staff-2',
            order_num: 3,
            notes: null,
            shelf_name: 'e4',
            on_wishlist: false,
            created_date:
                '2026-08-03T00:00:00Z',
        },
    ],
    total: 3,
}

const recentBooksFixture = {
    items: [
        {
            id: 'recent-1',
            title: 'Newest Book',
            authors: 'Newest Author',
            status: 'available',
        },
        {
            id: 'recent-2',
            title: 'Second Newest Book',
            authors: 'Second Author',
            status: 'available',
        },
    ],
    total: 2,
} as BookList

type RecentBooksQuery =
    ReturnType<typeof useRecentBooks>

type CategoriesQuery =
    ReturnType<typeof useCategories>

type CollectionsQuery =
    ReturnType<typeof useCollections>

type CollectionBooksQuery =
    ReturnType<typeof useCollectionBooks>

type BreakdownsQuery =
    ReturnType<typeof useDashboardBreakdowns>

function mockRecentBooksQuery(
    overrides: Partial<RecentBooksQuery> = {},
) {
    mockUseRecentBooks.mockReturnValue({
        data: recentBooksFixture,
        error: null,
        isPending: false,
        isError: false,
        ...overrides,
    } as unknown as RecentBooksQuery)
}

function mockCategoriesQuery(
    overrides: Partial<CategoriesQuery> = {},
) {
    mockUseCategories.mockReturnValue({
        data: categoriesFixture,
        error: null,
        isPending: false,
        isError: false,
        ...overrides,
    } as unknown as CategoriesQuery)
}

function mockCollectionsQuery(
    overrides: Partial<CollectionsQuery> = {},
) {
    mockUseCollections.mockReturnValue({
        data: collectionsFixture,
        error: null,
        isPending: false,
        isError: false,
        ...overrides,
    } as unknown as CollectionsQuery)
}

function mockCollectionBooksQuery(
    overrides: Partial<CollectionBooksQuery> = {},
) {
    mockUseCollectionBooks.mockReturnValue({
        data: staffPicksFixture,
        error: null,
        isPending: false,
        isError: false,
        ...overrides,
    } as unknown as CollectionBooksQuery)
}

function mockBreakdownsQuery(
    overrides: Partial<BreakdownsQuery> = {},
) {
    mockUseDashboardBreakdowns.mockReturnValue({
        data: breakdownsFixture,
        error: null,
        isPending: false,
        isError: false,
        ...overrides,
    } as unknown as BreakdownsQuery)
}

function mockSuccessState() {
    mockRecentBooksQuery()
    mockCategoriesQuery()
    mockCollectionsQuery()
    mockCollectionBooksQuery()
    mockBreakdownsQuery()
}

describe('HomePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockReachableApi()
        mockSuccessState()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders as the application homepage', async () => {
        await renderAppTree(['/'])

        const heading = screen.getByRole('heading', {
            level: 1,
            name: 'Shade Library',
        })

        expect(heading).toBeInTheDocument()

        expect(heading).toHaveAttribute(
            'tabindex',
            '-1',
        )

        expect(
            screen.getByRole('link', {
                name: 'About Shade Library',
            }),
        ).toHaveAttribute(
            'href',
            '/about',
        )

        await waitFor(() => {
            expect(document.title).toBe(
                'Shade Library — Shade',
            )
        })
    })

    it('renders the five largest categories with canonical Books links', async () => {
        await renderAppTree(['/'])

        const section = screen
            .getByRole('heading', {
                level: 2,
                name: 'Browse the Stacks',
            })
            .closest('section')

        expect(section).not.toBeNull()

        const categorySection =
            within(section!)

        const expected = [
            [
                'Fantasy',
                '/books?category_id=cat-fantasy',
            ],
            [
                'Religion',
                '/books?category_id=cat-religion',
            ],
            [
                'History',
                '/books?category_id=cat-history',
            ],
            [
                'Philosophy',
                '/books?category_id=cat-philosophy',
            ],
            [
                'Science',
                '/books?category_id=cat-science',
            ],
        ] as const

        for (const [name, href] of expected) {
            expect(
                categorySection.getByRole(
                    'link',
                    {
                        name: new RegExp(
                            `^Browse ${name}, \\d+ books$`,
                            'i',
                        ),
                    },
                ),
            ).toHaveAttribute(
                'href',
                href,
            )
        }

        expect(
            categorySection.queryByRole(
                'link',
                {
                    name: 'Poetry',
                },
            ),
        ).not.toBeInTheDocument()
    })

    it('resolves Staff Picks and renders only shelved memberships', async () => {
        await renderAppTree(['/'])

        expect(
            mockUseCollectionBooks,
        ).toHaveBeenCalledWith(
            'collection-staff',
            {
                enabled: true,
            },
        )

        expect(
            screen.getAllByTestId(
                'home-staff-pick',
            ),
        ).toHaveLength(2)

        expect(
            mockHomeStaffPick,
        ).toHaveBeenCalledWith(
            'book-staff-1',
        )

        expect(
            mockHomeStaffPick,
        ).toHaveBeenCalledWith(
            'book-staff-2',
        )

        expect(
            mockHomeStaffPick,
        ).not.toHaveBeenCalledWith(
            'book-wishlist',
        )
    })

    it('renders the recent additions returned by the newest-books query', async () => {
        await renderAppTree(['/'])

        const section = screen
            .getByRole('heading', {
                level: 2,
                name: 'New Additions',
            })
            .closest('section')

        expect(section).not.toBeNull()

        const recentSection =
            within(section!)

        expect(
            recentSection.getByRole('link', {
                name: 'Newest Book',
            }),
        ).toHaveAttribute(
            'href',
            '/books/recent-1',
        )

        expect(
            recentSection.getByText(
                'Newest Author',
            ),
        ).toBeInTheDocument()

        expect(
            recentSection.getByRole('link', {
                name: 'Second Newest Book',
            }),
        ).toHaveAttribute(
            'href',
            '/books/recent-2',
        )
    })

    it('keeps core Home navigation available when category metadata fails', async () => {
        mockBreakdownsQuery({
            data: undefined,
            error: new Error('failed'),
            isError: true,
        })

        await renderAppTree(['/'])

        expect(
            screen.getByText(
                'Featured categories could not be loaded.',
            ),
        ).toBeInTheDocument()

        const shortcuts = screen.getByRole(
            'navigation',
            {
                name: 'Home shortcuts',
            },
        )

        expect(
            within(shortcuts).getByRole(
                'link',
                {
                    name: 'Browse',
                },
            ),
        ).toHaveAttribute(
            'href',
            '/books',
        )

        expect(
            within(shortcuts).getByRole(
                'link',
                {
                    name: 'About',
                },
            ),
        ).toHaveAttribute(
            'href',
            '/about',
        )
    })

    it('shows an explicit fallback when Staff Picks is absent', async () => {
        mockCollectionsQuery({
            data: {
                items: [],
                total: 0,
            },
        })

        await renderAppTree(['/'])

        expect(
            screen.getByText(
                'No Staff Picks collection is available.',
            ),
        ).toBeInTheDocument()

        expect(
            mockHomeStaffPick,
        ).not.toHaveBeenCalled()

        expect(
            mockUseCollectionBooks,
        ).toHaveBeenCalledWith(
            '',
            {
                enabled: false,
            },
        )
    })

    it('provides the required secondary discovery destinations', async () => {
        await renderAppTree(['/'])

        const shortcuts = screen.getByRole(
            'navigation',
            {
                name: 'Home shortcuts',
            },
        )

        expect(
            within(shortcuts).getByRole(
                'link',
                {
                    name: 'Browse',
                },
            ),
        ).toHaveAttribute(
            'href',
            '/books',
        )

        expect(
            within(shortcuts).getByRole(
                'link',
                {
                    name: 'Collections',
                },
            ),
        ).toHaveAttribute(
            'href',
            '/collections',
        )

        expect(
            within(shortcuts).getByRole(
                'link',
                {
                    name: 'Wishlists',
                },
            ),
        ).toHaveAttribute(
            'href',
            '/wishlists',
        )

        expect(
            within(shortcuts).getByRole(
                'link',
                {
                    name: 'About',
                },
            ),
        ).toHaveAttribute(
            'href',
            '/about',
        )
    })

    it('does not render the relocated About content', async () => {
        await renderAppTree(['/'])

        expect(
            screen.queryByRole('heading', {
                level: 2,
                name: 'For Charles Leewright',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('heading', {
                level: 2,
                name: 'Lending Policy',
            }),
        ).not.toBeInTheDocument()
    })
})
