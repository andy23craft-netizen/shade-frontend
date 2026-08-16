import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    ShelfRead,
} from '../../../api/apiTypes'
import { bookFormDefaults } from './bookFormDefaults'
import type { BookFormValues } from './BookForm'
import {
    formValuesToBookCreate,
    normalizeTags,
    parseTagsInput,
    validateBookFormValues,
} from './bookFormModel'

const SHELVES: ShelfRead[] = [
    {
        shelf_id: 'id-unknown',
        common_name: 'unknown',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-a1',
        common_name: 'a1',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-removed',
        common_name: 'removed',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

function makeValues(
    overrides: Partial<BookFormValues> = {},
): BookFormValues {
    return {
        ...bookFormDefaults,
        title: 'Dune',
        authors: 'Frank Herbert',
        shelfId: 'id-unknown',
        ...overrides,
    }
}

describe('normalizeTags', () => {
    it('trims tags and drops empties', () => {
        expect(
            normalizeTags([
                '  classic  ',
                '',
                '  ',
                'sci-fi',
            ]),
        ).toEqual([
            'classic',
            'sci-fi',
        ])
    })

    it('removes duplicates while preserving first-seen order', () => {
        expect(
            normalizeTags([
                'classic',
                'sci-fi',
                'classic',
                'Sci-fi',
                'sci-fi',
            ]),
        ).toEqual([
            'classic',
            'sci-fi',
            'Sci-fi',
        ])
    })
})

describe('parseTagsInput', () => {
    it('splits a comma-separated string into normalized tags', () => {
        expect(
            parseTagsInput(
                ' classic, sci-fi,, classic ',
            ),
        ).toEqual([
            'classic',
            'sci-fi',
        ])
    })
})

describe('validateBookFormValues', () => {
    it('requires title, authors, and shelf', () => {
        expect(
            validateBookFormValues(
                makeValues({
                    title: '   ',
                    authors: '',
                    shelfId: '',
                }),
            ),
        ).toEqual({
            title: 'Title is required.',
            authors: 'Authors are required.',
            shelfId: 'Shelf is required.',
        })
    })

    it('enforces 255-character title and authors limits', () => {
        const long = 'a'.repeat(256)

        expect(
            validateBookFormValues(
                makeValues({
                    title: long,
                    authors: long,
                }),
            ),
        ).toEqual({
            title:
                'Title must be at most 255 characters.',
            authors:
                'Authors must be at most 255 characters.',
        })
    })

    it('rejects invalid ISBN check digits', () => {
        expect(
            validateBookFormValues(
                makeValues({
                    isbn13: '0441172718',
                }),
            ).isbn13,
        ).toBe(
            'Enter a valid ISBN-10 or ISBN-13.',
        )
    })

    it('accepts formatted valid ISBNs', () => {
        expect(
            validateBookFormValues(
                makeValues({
                    isbn13: '978-0-441-17271-9',
                }),
            ),
        ).toEqual({})
    })

    it('rejects non-positive pages', () => {
        expect(
            validateBookFormValues(
                makeValues({
                    pages: '0',
                }),
            ).pages,
        ).toBe(
            'Pages must be a positive whole number.',
        )

        expect(
            validateBookFormValues(
                makeValues({
                    pages: '1.5',
                }),
            ).pages,
        ).toBe(
            'Pages must be a positive whole number.',
        )
    })
})

describe('formValuesToBookCreate', () => {
    it('converts blank optional fields to null and resolves shelf_name', () => {
        expect(
            formValuesToBookCreate(
                makeValues({
                    isbn13: '   ',
                    publisher: '',
                    publication_date: '  ',
                    pages: '',
                    acquisition_source: '',
                    purchase_date: '',
                    purchase_price: '',
                    notes: '   ',
                    tags: '',
                }),
                SHELVES,
            ),
        ).toEqual({
            title: 'Dune',
            authors: 'Frank Herbert',
            category: 'unknown',
            shelf_name: 'unknown',
            is_read: false,
            status: 'available',
            isbn13: null,
            publisher: null,
            publication_date: null,
            pages: null,
            acquisition_source: null,
            purchase_date: null,
            purchase_price: null,
            notes: null,
            tags: null,
        })
    })

    it('passes through year-only publication_date', () => {
        expect(
            formValuesToBookCreate(
                makeValues({
                    publication_date: '1965',
                }),
                SHELVES,
            ).publication_date,
        ).toBe('1965')
    })

    it('serializes purchase_price as a number without currency fields', () => {
        const book = formValuesToBookCreate(
            makeValues({
                purchase_price: '12.50',
            }),
            SHELVES,
        )

        expect(book.purchase_price).toBe(12.5)
        expect(book).not.toHaveProperty(
            'currency',
        )
    })

    it('preserves ISBN separators and creates with default status/read', () => {
        const book = formValuesToBookCreate(
            makeValues({
                isbn13: '978-0-441-17271-9',
                tags: ' classic , sci-fi, classic ',
                shelfId: 'id-a1',
            }),
            SHELVES,
        )

        expect(book.isbn13).toBe(
            '978-0-441-17271-9',
        )
        expect(book.shelf_name).toBe('a1')
        expect(book.status).toBe('available')
        expect(book.is_read).toBe(false)
        expect(book.tags).toEqual([
            'classic',
            'sci-fi',
        ])
    })

    it('serializes positive pages as an integer', () => {
        expect(
            formValuesToBookCreate(
                makeValues({
                    pages: '412',
                }),
                SHELVES,
            ).pages,
        ).toBe(412)
    })
})
