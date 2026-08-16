import {
    describe,
    expect,
    it,
} from 'vitest'
import type {
    BookList,
    BookLookupResponse,
    BookRead,
    DashboardSummary,
    LoanList,
    LoanRead,
    ShelfCreate,
    ShelfRead,
    ShelfUpdate,
} from './apiTypes'

describe('API transport types', () => {
    it('preserves BookRead transport field names', () => {
        const book = {
            id: 'book-1',
            title: 'A Book',
            authors: 'An Author',
            category: 'unknown',
            shelf_name: 'unknown',
            status: 'available',
            is_read: false,
            creation_date: '2026-08-01T00:00:00Z',
            updated_date: '2026-08-02T00:00:00Z',
            deletion_date: null,
            times_borrowed: 3,
            last_borrowed_at: '2026-07-01T00:00:00Z',
            average_loan_days: 4.5,
        } satisfies BookRead

        expect(book.creation_date)
            .toBe('2026-08-01T00:00:00Z')

        expect(book.updated_date)
            .toBe('2026-08-02T00:00:00Z')

        expect(book.shelf_name).toBe('unknown')
        expect(book.times_borrowed).toBe(3)
        expect(book.average_loan_days).toBe(4.5)
    })

    it('preserves ShelfRead transport field names', () => {
        const shelf = {
            shelf_id: 'shelf-1',
            common_name: 'a1',
            location: 'Living room',
            description: null,
            created_date: '2026-01-01T00:00:00Z',
            updated_date: '2026-01-02T00:00:00Z',
        } satisfies ShelfRead

        expect(shelf.shelf_id).toBe('shelf-1')
        expect(shelf.common_name).toBe('a1')
        expect(shelf.location).toBe('Living room')
        expect(shelf.description).toBeNull()
    })

    it('preserves ShelfCreate and ShelfUpdate field names', () => {
        const create = {
            common_name: 'a1',
            location: 'Living room',
            description: null,
        } satisfies ShelfCreate

        const update = {
            common_name: 'b2',
            location: null,
            description: 'Notes',
        } satisfies ShelfUpdate

        expect(create.common_name).toBe('a1')
        expect(update.description).toBe('Notes')
    })

    it('preserves LoanRead audit field names', () => {
        const loan = {
            id: 'loan-1',
            book_id: 'book-1',
            borrower: 'Borrower',
            checked_out_at: '2026-08-01T00:00:00Z',
            returned_at: null,
            created_date: '2026-08-01T00:00:00Z',
            last_updated_date: '2026-08-01T00:00:00Z',
        } satisfies LoanRead

        expect(loan.created_date)
            .toBe('2026-08-01T00:00:00Z')

        expect(loan.last_updated_date)
            .toBe('2026-08-01T00:00:00Z')

        expect(loan.returned_at).toBeNull()
    })

    it('preserves list wrappers', () => {
        const books = {
            items: [],
            total: 0,
        } satisfies BookList

        const loans = {
            items: [],
            total: 0,
        } satisfies LoanList

        expect(books.total).toBe(0)
        expect(loans.total).toBe(0)
    })

    it('allows lookup not-found as a successful response', () => {
        const result = {
            found: false,
            draft: null,
        } satisfies BookLookupResponse

        expect(result.found).toBe(false)
        expect(result.draft).toBeNull()
    })

    it('preserves nullable dashboard averages', () => {
        const dashboard = {
            total_books: 10,
            checked_out: 0,
            read: 0,
            unread: 10,
            recently_added: 1,
            recent_window_days: 30,
            borrowing: {
                active_loans: 0,
                lifetime_loans: 0,
                average_loan_days: null,
            },
            reading: {
                books_read: 0,
                books_unread: 10,
                average_rating: null,
            },
        } satisfies DashboardSummary

        expect(
            dashboard.borrowing.average_loan_days,
        ).toBeNull()

        expect(
            dashboard.reading.average_rating,
        ).toBeNull()
    })
})
