import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { BooksPage } from './BooksPage'

const mockUseBooks = vi.fn()

vi.mock('../../../api/booksQueries', () => ({
    useBooks: () => mockUseBooks(),
}))

function renderBooksPage() {
    return render(
        <MemoryRouter>
            <BooksPage />
        </MemoryRouter>,
    )
}

describe('BooksPage', () => {
    it('renders the active collection with book metadata and links', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                total: 2,
                items: [
                    {
                        id: 'book-1',
                        title: 'The Left Hand of Darkness',
                        authors: 'Ursula K. Le Guin',
                        status: 'available',
                        is_read: true,
                        category: 'fiction',
                        shelf: 'liz_tbr',
                    },
                    {
                        id: 'book-2',
                        title: 'Invisible Cities',
                        authors: 'Italo Calvino',
                        status: 'on_loan',
                        is_read: false,
                        category: 'fiction',
                        shelf: 'unknown',
                    },
                ],
            },
        })

        renderBooksPage()

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Books',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByText('2 books in the library.'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'The Left Hand of Darkness',
            }),
        ).toHaveAttribute(
            'href',
            '/books/book-1',
        )

        expect(
            screen.getByText(
                'Ursula K. Le Guin',
                { exact: false },
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Invisible Cities'),
        ).toBeInTheDocument()

        expect(
            screen.getByText(
                'Italo Calvino',
                { exact: false },
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Status: available'),
        ).toBeInTheDocument()

        expect(
            screen.getByText('Status: on_loan'),
        ).toBeInTheDocument()
    })

    it('renders an empty state when the collection has no books', () => {
        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: false,
            data: {
                total: 0,
                items: [],
            },
        })

        renderBooksPage()

        expect(
            screen.getByRole('heading', {
                name: 'Your library is empty.',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Add Book',
            }),
        ).toHaveAttribute(
            'href',
            '/books/new',
        )
    })

    it('renders a loading state', () => {
        mockUseBooks.mockReturnValue({
            isPending: true,
            isError: false,
        })

        renderBooksPage()

        expect(
            screen.getByRole('status'),
        ).toHaveTextContent(
            'Loading books…',
        )
    })

    it('renders an API error with retry', () => {
        const refetch = vi.fn()

        mockUseBooks.mockReturnValue({
            isPending: false,
            isError: true,
            error: new Error(
                'The library API is unavailable.',
            ),
            refetch,
        })

        renderBooksPage()

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'The library API is unavailable.',
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Retry',
            }),
        )

        expect(refetch).toHaveBeenCalledOnce()
    })
})
