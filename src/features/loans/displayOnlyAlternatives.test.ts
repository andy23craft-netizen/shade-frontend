import {
    describe,
    expect,
    it,
} from 'vitest'

import type { BookRead } from '../../api/apiTypes'
import {
    buildAuthorTitleAlternateQuery,
    buildIsbnAlternateQuery,
    filterCheckoutAlternatives,
    mergeCheckoutAlternatives,
} from './displayOnlyAlternatives'

function makeBook(
    overrides: Partial<BookRead> = {},
): BookRead {
    return {
        id: 'book-1',
        isbn13: '9780441172719',
        title: 'Dune',
        authors: 'Frank Herbert',
        status: 'available',
        deletion_date: null,
        ...overrides,
    } as BookRead
}

describe('displayOnlyAlternatives', () => {
    describe('buildIsbnAlternateQuery', () => {
        it('compacts punctuation without rewriting ISBN digits', () => {
            const book = makeBook({
                isbn13: '978-0-441-17271-9',
            })

            expect(
                buildIsbnAlternateQuery(book),
            ).toBe('9780441172719')
        })

        it('returns null when ISBN is missing', () => {
            const book = makeBook({
                isbn13: null,
            })

            expect(
                buildIsbnAlternateQuery(book),
            ).toBeNull()
        })

        it('returns null when ISBN contains only removable punctuation', () => {
            const book = makeBook({
                isbn13: ' - . / ',
            })

            expect(
                buildIsbnAlternateQuery(book),
            ).toBeNull()
        })
    })

    describe('buildAuthorTitleAlternateQuery', () => {
        it('trims author and title for the query', () => {
            const book = makeBook({
                authors: '  Frank Herbert  ',
                title: '  Dune  ',
            })

            expect(
                buildAuthorTitleAlternateQuery(book),
            ).toEqual({
                author: 'Frank Herbert',
                title: 'Dune',
            })
        })

        it('returns null when author is blank', () => {
            const book = makeBook({
                authors: '   ',
            })

            expect(
                buildAuthorTitleAlternateQuery(book),
            ).toBeNull()
        })

        it('returns null when title is blank', () => {
            const book = makeBook({
                title: '   ',
            })

            expect(
                buildAuthorTitleAlternateQuery(book),
            ).toBeNull()
        })
    })

    describe('filterCheckoutAlternatives', () => {
        it('excludes the blocked book', () => {
            const blocked = makeBook({
                id: 'blocked',
                status: 'display_only',
            })
            const alternate = makeBook({
                id: 'alternate',
            })

            expect(
                filterCheckoutAlternatives(
                    [blocked, alternate],
                    'blocked',
                ),
            ).toEqual([alternate])
        })

        it('excludes books that are not available', () => {
            const available = makeBook({
                id: 'available',
            })
            const onLoan = makeBook({
                id: 'on-loan',
                status: 'on_loan',
            })
            const displayOnly = makeBook({
                id: 'display-only',
                status: 'display_only',
            })

            expect(
                filterCheckoutAlternatives(
                    [
                        available,
                        onLoan,
                        displayOnly,
                    ],
                    'blocked',
                ),
            ).toEqual([available])
        })

        it('excludes soft-deleted books', () => {
            const available = makeBook({
                id: 'available',
            })
            const deleted = makeBook({
                id: 'deleted',
                deletion_date:
                    '2026-08-18T12:00:00Z',
            })

            expect(
                filterCheckoutAlternatives(
                    [available, deleted],
                    'blocked',
                ),
            ).toEqual([available])
        })
    })

    describe('mergeCheckoutAlternatives', () => {
        it('prefers ISBN results and removes duplicate ids', () => {
            const isbnMatch = makeBook({
                id: 'isbn-match',
                title: 'Dune',
            })
            const sharedMatch = makeBook({
                id: 'shared-match',
                title: 'Dune',
            })
            const editionMatch = makeBook({
                id: 'edition-match',
                title: 'Dune: Illustrated Edition',
            })

            expect(
                mergeCheckoutAlternatives(
                    [isbnMatch, sharedMatch],
                    [sharedMatch, editionMatch],
                    'blocked',
                ).map((book) => book.id),
            ).toEqual([
                'isbn-match',
                'shared-match',
                'edition-match',
            ])
        })

        it('filters ineligible books from both strategies', () => {
            const isbnUnavailable = makeBook({
                id: 'isbn-unavailable',
                status: 'on_loan',
            })
            const editionAvailable = makeBook({
                id: 'edition-available',
            })

            expect(
                mergeCheckoutAlternatives(
                    [isbnUnavailable],
                    [editionAvailable],
                    'blocked',
                ),
            ).toEqual([editionAvailable])
        })
    })
})
