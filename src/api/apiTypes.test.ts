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
    WishlistBookCreate,
    WishlistBookList,
    WishlistBookRead,
    WishlistBookStatus,
    WishlistCreate,
    WishlistList,
    WishlistRead,
    WishlistUpdate,
} from './apiTypes'

describe('API transport types', () => {
    it('preserves BookRead.id as the catalog identity field', () => {
        const book = {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'A Book',
            authors: [
                {
                    author_id: 'author-1',
                    first_name: 'An',
                    surname: 'Author',
                },
            ],
            categories: [],
            shelf_name: 'unknown',
            placement_state: 'shelved',
            status: 'available',
            is_read: false,
            creation_date: '2026-08-01T00:00:00Z',
            updated_date: '2026-08-02T00:00:00Z',
            times_borrowed: 3,
            last_borrowed_at: '2026-07-01T00:00:00Z',
            average_loan_days: 4.5,
        } satisfies BookRead

        expect(book.id).toBe(
            '550e8400-e29b-41d4-a716-446655440000',
        )
        expect(book).not.toHaveProperty('book_id')

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

    it('preserves LoanRead.book_id as the FK to BookRead.id', () => {
        const loan = {
            id: 'loan-1',
            book_id: '550e8400-e29b-41d4-a716-446655440000',
            borrower: 'Borrower',
            checked_out_at: '2026-08-01T00:00:00Z',
            returned_at: null,
            created_date: '2026-08-01T00:00:00Z',
            last_updated_date: '2026-08-01T00:00:00Z',
        } satisfies LoanRead

        expect(loan.book_id).toBe(
            '550e8400-e29b-41d4-a716-446655440000',
        )
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
            stash_count: 0,
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

    it('preserves wishlist transport field names', () => {
        const create = {
            name: 'TBR',
            description: null,
        } satisfies WishlistCreate

        const update = {
            name: 'Later',
            description: 'Updated',
        } satisfies WishlistUpdate

        const wishlist = {
            wishlist_id: 'wishlist-1',
            name: 'TBR',
            description: null,
            created_date: '2026-08-01T00:00:00Z',
            last_updated_date: '2026-08-01T00:00:00Z',
        } satisfies WishlistRead

        const list = {
            items: [wishlist],
            total: 1,
        } satisfies WishlistList

        expect(create.name).toBe('TBR')
        expect(update.description).toBe('Updated')
        expect(wishlist.wishlist_id).toBe('wishlist-1')
        expect(list.total).toBe(1)
    })

    it('preserves wishlist membership book_id as the FK to BookRead.id', () => {
        const status = 'wanted' satisfies WishlistBookStatus

        const create = {
            book_id: '550e8400-e29b-41d4-a716-446655440000',
            status,
        } satisfies WishlistBookCreate

        const membership = {
            wishlist_book_id: 'membership-1',
            wishlist_id: 'wishlist-1',
            book_id: '550e8400-e29b-41d4-a716-446655440000',
            book_title: 'A Book',
            book_status: 'available',
            status,
            priority: null,
            notes: null,
            url: null,
            created_date: '2026-08-01T00:00:00Z',
        } satisfies WishlistBookRead

        const list = {
            items: [membership],
            total: 1,
        } satisfies WishlistBookList

        expect(create.book_id).toBe(
            '550e8400-e29b-41d4-a716-446655440000',
        )
        expect(membership.book_id).toBe(create.book_id)
        expect(membership.priority).toBeNull()
        expect(list.total).toBe(1)
    })
})
