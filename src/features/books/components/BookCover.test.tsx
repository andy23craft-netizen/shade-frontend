import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    useBookCover,
} from '../../../api/booksQueries'

import {
    BookCover,
} from './BookCover'

vi.mock(
    '../../../api/booksQueries',
    () => ({
        useBookCover: vi.fn(),
    }),
)

const mockedUseBookCover =
    vi.mocked(useBookCover)

describe('BookCover', () => {
    const createObjectURL =
        vi.fn()

    const revokeObjectURL =
        vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()

        createObjectURL.mockReturnValue(
            'blob:shade-cover',
        )

        vi.stubGlobal(
            'URL',
            {
                ...URL,
                createObjectURL,
                revokeObjectURL,
            },
        )

        mockedUseBookCover.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
        } as unknown as ReturnType<
            typeof useBookCover
        >)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('renders the intentional placeholder when no cover is available', () => {
        render(
            <BookCover
                bookId="book-123"
                title="Pale Fire"
                status="available"
            />,
        )

        expect(
            screen.getByRole('img', {
                name:
                    'No cover available for Pale Fire',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('AVAILABLE'),
        ).toBeInTheDocument()
    })

    it('renders a resolved cover blob', () => {
        const blob = new Blob(
            ['cover-image'],
            {
                type: 'image/jpeg',
            },
        )

        mockedUseBookCover.mockReturnValue({
            data: blob,
            isPending: false,
            isError: false,
        } as ReturnType<
            typeof useBookCover
        >)

        render(
            <BookCover
                bookId="book-123"
                title="Pale Fire"
                status="available"
            />,
        )

        expect(
            createObjectURL,
        ).toHaveBeenCalledWith(blob)

        expect(
            screen.getByRole('img', {
                name: 'Cover of Pale Fire',
            }),
        ).toHaveAttribute(
            'src',
            'blob:shade-cover',
        )
    })

    it('revokes the object URL on unmount', () => {
        const blob = new Blob(
            ['cover-image'],
        )

        mockedUseBookCover.mockReturnValue({
            data: blob,
            isPending: false,
            isError: false,
        } as ReturnType<
            typeof useBookCover
        >)

        const { unmount } = render(
            <BookCover
                bookId="book-123"
                title="Pale Fire"
                status="available"
            />,
        )

        unmount()

        expect(
            revokeObjectURL,
        ).toHaveBeenCalledWith(
            'blob:shade-cover',
        )
    })

    it('replaces a broken image with the placeholder', () => {
        mockedUseBookCover.mockReturnValue({
            data: new Blob(
                ['cover-image'],
            ),
            isPending: false,
            isError: false,
        } as ReturnType<
            typeof useBookCover
        >)

        render(
            <BookCover
                bookId="book-123"
                title="Pale Fire"
                status="available"
            />,
        )

        fireEvent.error(
            screen.getByRole('img', {
                name: 'Cover of Pale Fire',
            }),
        )

        expect(
            screen.getByRole('img', {
                name:
                    'No cover available for Pale Fire',
            }),
        ).toBeInTheDocument()
    })

    it('renders a decorative cover with empty alt text', () => {
        mockedUseBookCover.mockReturnValue({
            data: new Blob(
                ['cover-image'],
            ),
            isPending: false,
            isError: false,
        } as ReturnType<
            typeof useBookCover
        >)

        const { container } = render(
            <BookCover
                bookId="book-123"
                title="Pale Fire"
                status="available"
                decorative
            />,
        )

        const image =
            container.querySelector(
                '.book-cover__image',
            )

        expect(image).toHaveAttribute(
            'alt',
            '',
        )
    })

    it.each([
        [
            'available',
            'AVAILABLE',
        ],
        [
            'on_loan',
            'ON LOAN',
        ],
        [
            'missing',
            'MISSING',
        ],
        [
            'display_only',
            'DISPLAY ONLY',
        ],
        [
            'wishlist',
            'WISHLIST',
        ],
    ] as const)(
        'renders the %s status stamp',
        (
            status,
            label,
        ) => {
            render(
                <BookCover
                    bookId={`book-${status}`}
                    title="Test Book"
                    status={status}
                />,
            )

            expect(
                screen.getByText(label),
            ).toBeInTheDocument()
        },
    )
})
