import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    BookRead,
} from '../../../api/apiTypes'
import {
    bookFormValuesFromBook,
    bookFormValuesToUpdate,
} from './bookEditModel'

const BOOK: BookRead = {
    id: 'book-1',
    title: 'Dune',
    authors: 'Frank Herbert',
    isbn13: '9780441172719',
    publisher: 'Ace',
    publication_date: '1965',
    pages: 412,
    category: 'fiction',
    shelf: 'a1',
    tags: ['science fiction', 'classic'],
    acquisition_source: 'Bookstore',
    purchase_date: '2026-01-02',
    purchase_price: 12.5,
    notes: 'First copy',
    status: 'available',
    is_read: true,
    completion_date: '2026-02-01',
    rating: 5,
    review: 'Great.',
    deletion_date: null,
    times_borrowed: 3,
    last_borrowed_at: null,
    average_loan_days: null,
    creation_date: '2026-01-01T00:00:00Z',
    updated_date: '2026-02-01T00:00:00Z',
}

describe('bookFormValuesFromBook', () => {
    it('maps book metadata into editable form values', () => {
        expect(
            bookFormValuesFromBook(BOOK),
        ).toEqual({
            title: 'Dune',
            authors: 'Frank Herbert',
            isbn13: '9780441172719',
            publisher: 'Ace',
            publication_date: '1965',
            pages: '412',
            category: 'fiction',
            shelf: 'a1',
            tags: 'science fiction, classic',
            acquisition_source: 'Bookstore',
            purchase_date: '2026-01-02',
            purchase_price: '12.5',
            notes: 'First copy',
        })
    })

    it('maps nullable metadata to blank form values', () => {
        const values = bookFormValuesFromBook({
            ...BOOK,
            isbn13: null,
            publisher: null,
            publication_date: null,
            pages: null,
            tags: null,
            acquisition_source: null,
            purchase_date: null,
            purchase_price: null,
            notes: null,
        })

        expect(values.isbn13).toBe('')
        expect(values.publisher).toBe('')
        expect(values.publication_date).toBe('')
        expect(values.pages).toBe('')
        expect(values.tags).toBe('')
        expect(values.acquisition_source).toBe('')
        expect(values.purchase_date).toBe('')
        expect(values.purchase_price).toBe('')
        expect(values.notes).toBe('')
    })
})

describe('bookFormValuesToUpdate', () => {
    it('returns an empty update when metadata is unchanged', () => {
        const values =
            bookFormValuesFromBook(BOOK)

        expect(
            bookFormValuesToUpdate(
                BOOK,
                values,
            ),
        ).toEqual({})
    })

    it('includes only changed metadata fields', () => {
        const values = {
            ...bookFormValuesFromBook(BOOK),
            title: 'Dune Messiah',
            shelf: 'a2' as const,
        }

        expect(
            bookFormValuesToUpdate(
                BOOK,
                values,
            ),
        ).toEqual({
            title: 'Dune Messiah',
            shelf: 'a2',
        })
    })

    it('sends null when nullable metadata is cleared', () => {
        const values = {
            ...bookFormValuesFromBook(BOOK),
            isbn13: '',
            publisher: '',
            pages: '',
            tags: '',
            purchase_price: '',
            notes: '',
        }

        expect(
            bookFormValuesToUpdate(
                BOOK,
                values,
            ),
        ).toEqual({
            isbn13: null,
            publisher: null,
            pages: null,
            tags: null,
            purchase_price: null,
            notes: null,
        })
    })

    it('normalizes changed metadata before comparison', () => {
        const values = {
            ...bookFormValuesFromBook(BOOK),
            title: '  Dune  ',
            authors: '  Frank Herbert  ',
            tags:
                'science fiction, classic, classic',
            purchase_price: '12.50',
        }

        expect(
            bookFormValuesToUpdate(
                BOOK,
                values,
            ),
        ).toEqual({})
    })

    it('does not include lifecycle or reading fields', () => {
        const values = {
            ...bookFormValuesFromBook(BOOK),
            title: 'Changed title',
        }

        const update =
            bookFormValuesToUpdate(
                BOOK,
                values,
            )

        expect(update).toEqual({
            title: 'Changed title',
        })

        expect(update).not.toHaveProperty(
            'status',
        )
        expect(update).not.toHaveProperty(
            'is_read',
        )
        expect(update).not.toHaveProperty(
            'completion_date',
        )
        expect(update).not.toHaveProperty(
            'rating',
        )
        expect(update).not.toHaveProperty(
            'review',
        )
    })
})
