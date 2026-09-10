import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
    useBooksByIds,
    useInfiniteBooks,
} from '../../../api/booksQueries'
import type { BookRead } from '../../../api/apiTypes'
import { BookLabelsPage } from './BookLabelsPage'

vi.mock('../../../api/booksQueries', () => ({
    useBooksByIds: vi.fn(),
    useInfiniteBooks: vi.fn(),
}))

const { getRawData, QRCodeStyling } = vi.hoisted(() => {
    const rawData = vi.fn()
    function QRCodeStylingMock() {
        return { getRawData: rawData }
    }

    return {
        getRawData: rawData,
        QRCodeStyling: vi.fn(QRCodeStylingMock),
    }
})

vi.mock('qr-code-styling', () => ({ default: QRCodeStyling }))

const book = {
    book_id: 'cleanup-book-id',
    title: 'Missing ISBN Book',
} as BookRead

const mockUseBooksByIds = vi.mocked(useBooksByIds)
const mockUseInfiniteBooks = vi.mocked(useInfiniteBooks)

describe('BookLabelsPage', () => {
    beforeEach(() => {
        QRCodeStyling.mockClear()
        getRawData.mockClear()
        getRawData.mockResolvedValue(new Blob(['qr']))
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn(() => 'blob:label-code'),
            revokeObjectURL: vi.fn(),
        })
        mockUseInfiniteBooks.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: false,
            hasNextPage: false,
            isFetchingNextPage: false,
            fetchNextPage: vi.fn(),
        } as unknown as ReturnType<typeof useInfiniteBooks>)
    })

    it('loads selected copies directly instead of requiring them in Browse results', () => {
        mockUseBooksByIds.mockReturnValue([
            {
                data: book,
                isPending: false,
                isError: false,
            },
        ] as ReturnType<typeof useBooksByIds>)

        render(
            <MemoryRouter initialEntries={[
                '/books/labels?book_id=cleanup-book-id',
            ]}>
                <BookLabelsPage />
            </MemoryRouter>,
        )

        expect(mockUseBooksByIds).toHaveBeenCalledWith([
            'cleanup-book-id',
        ])
        expect(screen.getByText('Missing ISBN Book')).toBeInTheDocument()
        expect(
            screen.queryByText(/Select one or more books from Browse/i),
        ).not.toBeInTheDocument()
    })

    it('renders each copy with the supplied QR styling and its Shade label value', async () => {
        mockUseBooksByIds.mockReturnValue([
            { data: book, isPending: false, isError: false },
        ] as ReturnType<typeof useBooksByIds>)

        render(
            <MemoryRouter initialEntries={['/books/labels?book_id=cleanup-book-id']}>
                <BookLabelsPage />
            </MemoryRouter>,
        )

        await waitFor(() => expect(QRCodeStyling).toHaveBeenCalled())

        expect(QRCodeStyling).toHaveBeenCalledWith(expect.objectContaining({
            type: 'canvas',
            data: 'shade:v1:book:cleanup-book-id',
            image: '/favicon-shade.png',
            dotsOptions: expect.objectContaining({ type: 'extra-rounded' }),
            cornersSquareOptions: expect.objectContaining({ type: 'extra-rounded' }),
        }))
        expect(getRawData).toHaveBeenCalledWith('png')
        expect(await screen.findByAltText('Shade label for Missing ISBN Book'))
            .toHaveAttribute('src', 'blob:label-code')
    })

    it('limits print pages to a manageable batch of labels', () => {
        const manyBooks = Array.from({ length: 49 }, (_, index) => ({
            ...book,
            book_id: `book-${index + 1}`,
            title: `Book ${index + 1}`,
        }))
        mockUseBooksByIds.mockReturnValue(manyBooks.map((item) => ({
            data: item,
            isPending: false,
            isError: false,
        })) as ReturnType<typeof useBooksByIds>)

        render(
            <MemoryRouter initialEntries={[
                `/books/labels?${manyBooks.map((item) => `book_id=${item.book_id}`).join('&')}`,
            ]}>
                <BookLabelsPage />
            </MemoryRouter>,
        )

        expect(screen.getByText('Batch 1 of 2')).toBeInTheDocument()
        expect(screen.getByText('Book 48')).toBeInTheDocument()
        expect(screen.queryByText('Book 49')).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Next batch' }))

        expect(screen.getByText('Batch 2 of 2')).toBeInTheDocument()
        expect(screen.getByText('Book 49')).toBeInTheDocument()
    })
})
