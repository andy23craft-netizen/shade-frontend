import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
} from 'react-router-dom'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    ShelfShowcase,
} from './ShelfShowcase'
import type {
    BookRead,
    ShelfRead,
} from '../../../api/apiTypes'

const mockUseBooks = vi.fn()

vi.mock('../../../api/booksQueries', () => ({
    useBooks: (options: unknown) =>
        mockUseBooks(options),
}))

vi.mock('../../books/components/BookCover', () => ({
    BookCover: ({
                    title,
                }: {
        title: string
    }) => (
        <div data-testid="book-cover">
            {title}
        </div>
    ),
}))

const shelf: ShelfRead = {
    shelf_id: 'shelf-a1',
    common_name: 'a1',
    location: 'Library',
    description: 'Main fiction shelf',
    created_date: '2026-01-01T00:00:00Z',
    updated_date: '2026-01-01T00:00:00Z',
}

const book: BookRead = {
    id: 'book-1',
    title: 'The Left Hand of Darkness',
    authors: 'Ursula K. Le Guin',
    categories: [],
    shelf_name: 'a1',
    status: 'available',
    is_read: false,
    isbn13: null,
    publisher: null,
    publication_date: '1969-01-01',
    pages: null,
    tags: null,
    purchase_date: null,
    purchase_price: null,
    acquisition_source: null,
    notes: null,
    completion_date: null,
    rating: null,
    review: null,
    times_borrowed: 0,
    last_borrowed_at: null,
    average_loan_days: null,
    creation_date: '2026-01-01T00:00:00Z',
    updated_date: '2026-01-01T00:00:00Z',
}

function renderShowcase(
    overrides: Partial<Parameters<typeof ShelfShowcase>[0]> = {},
) {
    const props = {
        shelf,
        bookCount: 1,
        isSystem: false,
        mutationBusy: false,
        canDelete: true,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        ...overrides,
    }

    render(
        <MemoryRouter>
            <ShelfShowcase {...props} />
        </MemoryRouter>,
    )

    return props
}

describe('ShelfShowcase', () => {
    beforeEach(() => {
        mockUseBooks.mockReset()

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                items: [book],
                total: 1,
            },
        })
    })

    it('loads a shelf preview with the expected query and renders book details', () => {
        renderShowcase()

        expect(
            mockUseBooks,
        ).toHaveBeenCalledWith({
            shelfName: 'a1',
            skip: 0,
            take: 12,
            sortBy: 'title',
            sortOrder: 'asc',
            enabled: true,
        })

        expect(
            screen.getByRole('heading', {
                name: 'A1',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: '1 book',
            }),
        ).toHaveAttribute(
            'href',
            '/books?shelf_name=a1',
        )

        expect(
            screen.getByRole('link', {
                name: 'The Left Hand of Darkness',
            }),
        ).toHaveAttribute(
            'href',
            '/books/book-1',
        )

        expect(
            screen.getByText('Ursula K. Le Guin'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('1969'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Library'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Main fiction shelf'),
        ).toBeInTheDocument()
    })

    it('renders the empty shelf state without enabling the book query', () => {
        renderShowcase({
            bookCount: 0,
        })

        expect(
            mockUseBooks,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                enabled: false,
            }),
        )

        expect(
            screen.getByText(
                'No books are currently assigned to this shelf.',
            ),
        ).toBeInTheDocument()
    })

    it('renders a loading shelf preview', () => {
        mockUseBooks.mockReturnValue({
            isPending: true,
            isError: false,
            data: undefined,
        })

        renderShowcase()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Loading A1…',
        )
    })

    it('renders a shelf preview error', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: true,
            data: undefined,
        })

        renderShowcase()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Unable to load this shelf preview.',
        )
    })

    it('shows system shelf state and suppresses delete', () => {
        renderShowcase({
            isSystem: true,
            canDelete: false,
        })

        expect(
            screen.getByText('System shelf'),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Delete',
            }),
        ).not.toBeInTheDocument()
    })

    it('fires edit and delete callbacks', () => {
        const onEdit = vi.fn()
        const onDelete = vi.fn()

        renderShowcase({
            onEdit,
            onDelete,
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Edit',
            }),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Delete',
            }),
        )

        expect(onEdit).toHaveBeenCalledOnce()
        expect(onDelete).toHaveBeenCalledOnce()
    })

    it('disables mutation actions while busy', () => {
        renderShowcase({
            mutationBusy: true,
        })

        expect(
            screen.getByRole('button', {
                name: 'Edit',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Delete',
            }),
        ).toBeDisabled()
    })

    it('shows the browse-all link when the shelf has more than the preview size', () => {
        renderShowcase({
            bookCount: 13,
        })

        expect(
            screen.getByRole('link', {
                name: 'Browse all 13 books',
            }),
        ).toHaveAttribute(
            'href',
            '/books?shelf_name=a1',
        )
    })

    it('updates arrow state from track scrolling and scrolls with the controls', () => {
        renderShowcase()

        const track =
            screen.getByRole('list', {
                name: 'Books on A1',
            })

        Object.defineProperties(track, {
            scrollWidth: {
                configurable: true,
                value: 1000,
            },
            clientWidth: {
                configurable: true,
                value: 400,
            },
            scrollLeft: {
                configurable: true,
                writable: true,
                value: 0,
            },
        })

        const scrollBy = vi.fn()
        Object.defineProperty(
            track,
            'scrollBy',
            {
                configurable: true,
                value: scrollBy,
            },
        )

        fireEvent.scroll(track)

        const nextButton =
            screen.getByRole('button', {
                name: 'Next books on A1',
            })

        expect(nextButton).toBeEnabled()

        fireEvent.click(nextButton)

        expect(scrollBy).toHaveBeenCalledWith({
            left: 420,
            behavior: 'smooth',
        })

        track.scrollLeft = 200

        fireEvent.scroll(track)

        const previousButton =
            screen.getByRole('button', {
                name: 'Previous books on A1',
            })

        expect(previousButton).toBeEnabled()

        fireEvent.click(previousButton)

        expect(scrollBy).toHaveBeenCalledWith({
            left: -420,
            behavior: 'smooth',
        })
    })

    it('updates scroll state when the window resizes', () => {
        renderShowcase()

        const track =
            screen.getByRole('list', {
                name: 'Books on A1',
            })

        Object.defineProperties(track, {
            scrollWidth: {
                configurable: true,
                value: 900,
            },
            clientWidth: {
                configurable: true,
                value: 400,
            },
            scrollLeft: {
                configurable: true,
                writable: true,
                value: 100,
            },
        })

        fireEvent(
            window,
            new Event('resize'),
        )

        expect(
            screen.getByRole('button', {
                name: 'Previous books on A1',
            }),
        ).toBeEnabled()

        expect(
            screen.getByRole('button', {
                name: 'Next books on A1',
            }),
        ).toBeEnabled()
    })

    it('renders books without optional author or publication year', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                items: [
                    {
                        ...book,
                        authors: null,
                        publication_date: null,
                    },
                ],
                total: 1,
            },
        })

        renderShowcase()

        expect(
            screen.queryByText('Ursula K. Le Guin'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('Year'),
        ).not.toBeInTheDocument()
    })
})
