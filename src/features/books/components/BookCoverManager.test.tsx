import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    useRemoveBookCover,
    useUploadBookCover,
} from '../../../api/booksQueries'
import {
    BookCoverManager,
} from './BookCoverManager'

vi.mock('../../../api/booksQueries', () => ({
    useUploadBookCover: vi.fn(),
    useRemoveBookCover: vi.fn(),
}))

const mockedUseUploadBookCover =
    vi.mocked(useUploadBookCover)

const mockedUseRemoveBookCover =
    vi.mocked(useRemoveBookCover)

function idleMutation(
    mutate = vi.fn(),
) {
    return {
        mutate,
        isPending: false,
    }
}

describe('BookCoverManager', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        mockedUseUploadBookCover.mockReturnValue(
            idleMutation() as unknown as ReturnType<
                typeof useUploadBookCover
            >,
        )

        mockedUseRemoveBookCover.mockReturnValue(
            idleMutation() as unknown as ReturnType<
                typeof useRemoveBookCover
            >,
        )
    })

    it('uploads the selected cover for the current book', () => {
        const mutate = vi.fn()

        mockedUseUploadBookCover.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUploadBookCover
        >)

        render(
            <BookCoverManager
                bookId="book-123"
            />,
        )

        const file = new File(
            ['cover-image'],
            'cover.webp',
            {
                type: 'image/webp',
            },
        )

        fireEvent.change(
            screen.getByLabelText(
                'Choose book cover image',
            ),
            {
                target: {
                    files: [file],
                },
            },
        )

        expect(mutate).toHaveBeenCalledWith(
            {
                id: 'book-123',
                file,
            },
            expect.any(Object),
        )
    })

    it('removes the custom cover for the current book', () => {
        const mutate = vi.fn()

        mockedUseRemoveBookCover.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRemoveBookCover
        >)

        render(
            <BookCoverManager
                bookId="book-123"
            />,
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Custom Cover',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            'book-123',
            expect.any(Object),
        )
    })

    it('disables both actions while uploading', () => {
        mockedUseUploadBookCover.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useUploadBookCover
        >)

        render(
            <BookCoverManager
                bookId="book-123"
            />,
        )

        expect(
            screen.getByRole('button', {
                name: 'Uploading…',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Remove Custom Cover',
            }),
        ).toBeDisabled()
    })

    it('disables both actions while removing', () => {
        mockedUseRemoveBookCover.mockReturnValue({
            mutate: vi.fn(),
            isPending: true,
        } as unknown as ReturnType<
            typeof useRemoveBookCover
        >)

        render(
            <BookCoverManager
                bookId="book-123"
            />,
        )

        expect(
            screen.getByRole('button', {
                name: 'Upload / Replace Cover',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Removing…',
            }),
        ).toBeDisabled()
    })

    it('surfaces upload errors', () => {
        const mutate = vi.fn(
            (
                _variables,
                options,
            ) => {
                options?.onError?.(
                    new Error(
                        'Upload exploded',
                    ),
                )
            },
        )

        mockedUseUploadBookCover.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useUploadBookCover
        >)

        render(
            <BookCoverManager
                bookId="book-123"
            />,
        )

        const file = new File(
            ['cover-image'],
            'cover.png',
            {
                type: 'image/png',
            },
        )

        fireEvent.change(
            screen.getByLabelText(
                'Choose book cover image',
            ),
            {
                target: {
                    files: [file],
                },
            },
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Upload exploded',
        )
    })

    it('surfaces remove errors', () => {
        const mutate = vi.fn(
            (
                _variables,
                options,
            ) => {
                options?.onError?.(
                    new Error(
                        'Remove exploded',
                    ),
                )
            },
        )

        mockedUseRemoveBookCover.mockReturnValue({
            mutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useRemoveBookCover
        >)

        render(
            <BookCoverManager
                bookId="book-123"
            />,
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Custom Cover',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Remove exploded',
        )
    })
})
