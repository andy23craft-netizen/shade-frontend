import {
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
} from 'react-router-dom'
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    BookRead,
} from '../../../api/apiTypes'
import {
    useBook,
} from '../../../api/booksQueries'
import {
    HomeStaffPick,
} from './HomeStaffPick'

vi.mock(
    '../../../api/booksQueries',
    () => ({
        useBook: vi.fn(),
    }),
)
vi.mock(
    '../../books/components/BookCover',
    () => ({
        BookCover: ({
                        bookId,
                        title,
                        status,
                    }: {
            bookId: string
            title: string
            status: string
        }) => (
            <div
                data-testid="book-cover"
                data-book-id={bookId}
                data-status={status}
            >
                Cover for {title}
            </div>
        ),
    }),
)

const mockUseBook =
    vi.mocked(useBook)

type BookQuery =
    ReturnType<typeof useBook>

function renderPick() {
    return render(
        <MemoryRouter>
            <HomeStaffPick bookId="book-1" />
        </MemoryRouter>,
    )
}

function mockBookQuery(
    overrides: Partial<BookQuery>,
) {
    mockUseBook.mockReturnValue({
        data: undefined,
        error: null,
        isPending: false,
        isError: false,
        ...overrides,
    } as unknown as BookQuery)
}

const bookFixture = {
    id: 'book-1',
    title: 'Pale Fire',
    authors: 'Vladimir Nabokov',
    publication_date: '1962-01-01',
    shelf_name: 'e4',
} as BookRead

describe('HomeStaffPick', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('shows a loading state while the book loads', () => {
        mockBookQuery({
            isPending: true,
        })

        renderPick()

        expect(
            screen.getByText(
                'Loading staff pick…',
            ),
        ).toBeInTheDocument()
    })

    it('renders the book as a compact catalog card', () => {
        mockBookQuery({
            data: bookFixture,
        })

        renderPick()

        expect(
            mockUseBook,
        ).toHaveBeenCalledWith('book-1')

        expect(
            screen.getByRole('link', {
                name: 'Pale Fire',
            }),
        ).toHaveAttribute(
            'href',
            '/books/book-1',
        )

        expect(
            screen.getByText(
                'Vladimir Nabokov',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('1962'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('E4'),
        ).toBeInTheDocument()

        const cover =
            screen.getByTestId('book-cover')

        expect(cover).toHaveAttribute(
            'data-book-id',
            'book-1',
        )
    })

    it('omits optional author and year metadata when absent', () => {
        mockBookQuery({
            data: {
                ...bookFixture,
                authors: '',
                publication_date: null,
            },
        })

        renderPick()

        expect(
            screen.getByRole('link', {
                name: 'Pale Fire',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(
                'Vladimir Nabokov',
            ),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByText('1962'),
        ).not.toBeInTheDocument()
    })

    it('renders nothing when the book query fails', () => {
        mockBookQuery({
            isError: true,
            error: new Error('failed'),
        })

        const {
            container,
        } = renderPick()

        expect(container).toBeEmptyDOMElement()
    })

    it('renders nothing when the book is missing', () => {
        mockBookQuery({
            data: undefined,
        })

        const {
            container,
        } = renderPick()

        expect(container).toBeEmptyDOMElement()
    })

})
