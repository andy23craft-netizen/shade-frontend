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

    it('does not remove the cover before confirmation', () => {
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

        expect(mutate).not.toHaveBeenCalled()

        expect(
            screen.getByRole('dialog'),
        ).toBeInTheDocument()
    })

    it('removes the custom cover after confirmation', () => {
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Cover',
            }),
        )

        expect(mutate).toHaveBeenCalledWith(
            'book-123',
            expect.any(Object),
        )
    })

    it('closes the confirmation dialog without removing when cancelled', () => {
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(mutate).not.toHaveBeenCalled()

        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
    })

    it('closes the confirmation dialog after a successful remove', () => {
        const mutate = vi.fn(
            (
                _variables,
                options,
            ) => {
                options?.onSuccess?.()
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Cover',
            }),
        )

        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
    })

    it('does not open remove confirmation while another cover action is pending', () => {
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Custom Cover',
            }),
        )

        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
    })

    it('closes remove confirmation when cancelled', () => {
        mockedUseRemoveBookCover.mockReturnValue({
            mutate: vi.fn(),
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
    })

    it('does not open remove confirmation while removal is pending', () => {
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Removing…',
            }),
        )

        expect(
            screen.queryByRole('dialog'),
        ).not.toBeInTheDocument()
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

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Remove Cover',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Remove exploded',
        )
    })
})
