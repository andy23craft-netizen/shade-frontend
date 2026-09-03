import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    BookRead,
    ShelfRead,
} from '../../../api/apiTypes'
import type {
    BookFormValues,
} from '../components/BookForm'
import {
    bookFormValuesFromBook,
    bookFormValuesToUpdate,
} from './bookEditModel'

const SHELVES: ShelfRead[] = [
    {
        shelf_id: 'id-a1',
        common_name: 'a1',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-a2',
        common_name: 'a2',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-unknown',
        common_name: 'unknown',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

const BOOK: BookRead = {
    book_id: 'book-1',
    title: 'Dune',
    authors: [
        {
            author_id: 'author-frank-herbert',
            first_name: 'Frank',
            surname: 'Herbert',
        },
    ],
    isbn13: '9780441172719',
    publisher: 'Ace',
    publication_date: '1965',
    pages: 412,
    categories: [{ category_id: 'cat-fiction', name: 'Fiction', slug: 'fiction' }],
    shelf_name: 'a1',
    placement_state: 'shelved',
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
    times_borrowed: 3,
    last_borrowed_at: null,
    average_loan_days: null,
    creation_date: '2026-01-01T00:00:00Z',
    updated_date: '2026-02-01T00:00:00Z',
}

describe('bookFormValuesFromBook', () => {
    it('maps book metadata into editable form values', () => {
        expect(
            bookFormValuesFromBook(
                BOOK,
                SHELVES,
            ),
        ).toEqual({
            title: 'Dune',
            authorIds: [
                'author-frank-herbert',
            ],
            isbn13: '9780441172719',
            publisher: 'Ace',
            publication_date: '1965',
            pages: '412',
            categoryIds: ['cat-fiction'],
            shelfId: 'id-a1',
            tags: 'science fiction, classic',
            acquisition_source: 'Bookstore',
            purchase_date: '2026-01-02',
            purchase_price: '12.5',
            notes: 'First copy',
        })
    })

    it('maps nullable metadata to blank form values', () => {
        const values = bookFormValuesFromBook(
            {
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
            },
            SHELVES,
        )

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
        const values = bookFormValuesFromBook(
            BOOK,
            SHELVES,
        )

        expect(
            bookFormValuesToUpdate(
                BOOK,
                values,
                SHELVES,
            ),
        ).toEqual({})
    })

    it('includes only changed metadata fields', () => {
        const values: BookFormValues = {
            ...bookFormValuesFromBook(
                BOOK,
                SHELVES,
            ),
            title: 'Dune Messiah',
            shelfId: 'id-a2',
        }

        expect(
            bookFormValuesToUpdate(
                BOOK,
                values,
                SHELVES,
            ),
        ).toEqual({
            title: 'Dune Messiah',
            shelf_name: 'a2',
        })
    })

    it('sends null when nullable metadata is cleared', () => {
        const values = {
            ...bookFormValuesFromBook(
                BOOK,
                SHELVES,
            ),
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
                SHELVES,
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
            ...bookFormValuesFromBook(
                BOOK,
                SHELVES,
            ),
            title: '  Dune  ',
            tags:
                'science fiction, classic, classic',
            purchase_price: '12.50',
        }

        expect(
            bookFormValuesToUpdate(
                BOOK,
                values,
                SHELVES,
            ),
        ).toEqual({})
    })

    it('includes category_ids when categories change', () => {
        const values: BookFormValues = {
            ...bookFormValuesFromBook(
                BOOK,
                SHELVES,
            ),
            categoryIds: [],
        }

        expect(
            bookFormValuesToUpdate(
                BOOK,
                values,
                SHELVES,
            ),
        ).toEqual({
            category_ids: [],
        })
    })

    it('omits category_ids when the set is unchanged', () => {
        const values = bookFormValuesFromBook(
            BOOK,
            SHELVES,
        )

        values.categoryIds = [
            'cat-fiction',
        ].reverse()

        expect(
            bookFormValuesToUpdate(
                BOOK,
                {
                    ...values,
                    categoryIds: [
                        'cat-fiction',
                    ],
                },
                SHELVES,
            ),
        ).toEqual({})
    })

    it('includes author_ids when authors change', () => {
        const values: BookFormValues = {
            ...bookFormValuesFromBook(
                BOOK,
                SHELVES,
            ),
            authorIds: [
                'author-ursula-le-guin',
                'author-frank-herbert',
            ],
        }

        expect(
            bookFormValuesToUpdate(
                BOOK,
                values,
                SHELVES,
            ),
        ).toEqual({
            author_ids: [
                'author-ursula-le-guin',
                'author-frank-herbert',
            ],
        })
    })

    it('treats author order as significant', () => {
        const twoAuthorBook: BookRead = {
            ...BOOK,
            authors: [
                {
                    author_id: 'author-first',
                    first_name: 'First',
                    surname: 'Author',
                },
                {
                    author_id: 'author-second',
                    first_name: 'Second',
                    surname: 'Author',
                },
            ],
        }

        const values =
            bookFormValuesFromBook(
                twoAuthorBook,
                SHELVES,
            )

        values.authorIds = [
            'author-second',
            'author-first',
        ]

        expect(
            bookFormValuesToUpdate(
                twoAuthorBook,
                values,
                SHELVES,
            ),
        ).toEqual({
            author_ids: [
                'author-second',
                'author-first',
            ],
        })
    })

    it('does not include lifecycle or reading fields', () => {
        const values = {
            ...bookFormValuesFromBook(
                BOOK,
                SHELVES,
            ),
            title: 'Changed title',
        }

        const update = bookFormValuesToUpdate(
            BOOK,
            values,
            SHELVES,
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
