import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/apiErrors'
import type { BookRead } from '../../../api/apiTypes'

const mutate = vi.fn()
vi.mock('../../../api/booksQueries', () => ({ useRefreshBookSummary: () => ({ mutate, isPending: false }) }))
import { BookProviderSummary } from './BookProviderSummary'
import { normalizeProviderSummary } from './bookProviderSummaryText'

const book = { book_id: 'book-1', title: 'Pale Fire', isbn13: '9780679723427', summary: null } as BookRead

describe('BookProviderSummary', () => {
    beforeEach(() => mutate.mockClear())

    it('renders provider text as paragraphs', () => {
        render(<BookProviderSummary book={{ ...book, summary: 'First paragraph.\n\nSecond paragraph.' }} />)
        expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument()
        expect(screen.getByText('First paragraph.')).toBeInTheDocument()
        expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Refresh summary' })).not.toBeInTheDocument()
        expect(mutate).not.toHaveBeenCalled()
    })

    it('normalizes provider Markdown into safe readable paragraphs', () => {
        expect(normalizeProviderSummary('An introduction.\n----------\nContains: [The Hitch Hiker](https://openlibrary.org/works/example)\n  [Mostly Harmless](https://openlibrary.org/works/other)')).toEqual(['An introduction.', 'Contains: The Hitch Hiker Mostly Harmless'])
    })

    it('does not offer refresh without an ISBN', () => {
        render(<BookProviderSummary book={{ ...book, isbn13: null }} />)
        expect(screen.getByText('A summary needs an ISBN for this book.')).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Refresh summary' })).not.toBeInTheDocument()
        expect(mutate).not.toHaveBeenCalled()
    })

    it('requests a missing ISBN-backed summary once and stops after provider not_available', async () => {
        render(<BookProviderSummary book={book} />)
        expect(mutate).toHaveBeenCalledWith('book-1', expect.any(Object))
        mutate.mock.calls[0][1].onSuccess({ availability_state: 'not_available', summary: null })
        await waitFor(() => expect(screen.getByText('No summary is available for this ISBN.')).toBeInTheDocument())
        expect(screen.queryByRole('button', { name: 'Refresh summary' })).not.toBeInTheDocument()
    })

    it.each([[502, 'service is unavailable'], [504, 'took too long']])('keeps the retry action after a %s failure', async (status, message) => {
        render(<BookProviderSummary book={book} />)
        mutate.mock.calls[0][1].onError(new ApiError({ kind: 'server', status, message: 'provider detail' }))
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(message))
        expect(screen.getByRole('button', { name: 'Retry summary' })).toBeInTheDocument()
    })
})
