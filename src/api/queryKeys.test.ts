import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    queryKeys,
} from './queryKeys'

describe('queryKeys.books list filters', () => {
    it('omits blank and whitespace author, title, category, and isbn', () => {
        expect(
            queryKeys.books.list({
                isbn: '  ',
                author: '',
                title: '\t',
                category: '   ',
            }),
        ).toEqual([
            'books',
            {
                includeDeleted: false,
            },
        ])
    })

    it('includes trimmed author, title, and category in list keys', () => {
        expect(
            queryKeys.books.list({
                author: '  Le Guin  ',
                title: ' Darkness ',
                category: ' fiction ',
            }),
        ).toEqual([
            'books',
            {
                includeDeleted: false,
                author: 'Le Guin',
                title: 'Darkness',
                category: 'fiction',
            },
        ])
    })

    it('distinguishes filtered infinite list keys', () => {
        expect(
            queryKeys.books.infiniteList({
                author: 'Le Guin',
                take: 30,
            }),
        ).not.toEqual(
            queryKeys.books.infiniteList({
                title: 'Darkness',
                take: 30,
            }),
        )
    })
})

describe('queryKeys.shelves', () => {
    it('uses an unpaginated list key under the shelves prefix', () => {
        expect(queryKeys.shelves.all).toEqual([
            'shelves',
        ])

        expect(queryKeys.shelves.list()).toEqual([
            'shelves',
            {
                list: true,
            },
        ])
    })

    it('isolates shelves keys from books and loans', () => {
        expect(
            queryKeys.shelves.list()[0],
        ).not.toBe(queryKeys.books.all[0])

        expect(
            queryKeys.shelves.list()[0],
        ).not.toBe(queryKeys.loans.all[0])
    })
})

describe('queryKeys.wishlists', () => {
    it('uses unpaginated list and books keys under the wishlists prefix', () => {
        expect(queryKeys.wishlists.all).toEqual([
            'wishlists',
        ])

        expect(queryKeys.wishlists.list()).toEqual([
            'wishlists',
            {
                list: true,
            },
        ])

        expect(
            queryKeys.wishlists.books('wishlist-1'),
        ).toEqual([
            'wishlists',
            'wishlist-1',
            'books',
        ])
    })

    it('isolates wishlists keys from books, loans, and shelves', () => {
        expect(
            queryKeys.wishlists.list()[0],
        ).not.toBe(queryKeys.books.all[0])

        expect(
            queryKeys.wishlists.list()[0],
        ).not.toBe(queryKeys.loans.all[0])

        expect(
            queryKeys.wishlists.list()[0],
        ).not.toBe(queryKeys.shelves.all[0])
    })
})

describe('queryKeys.version', () => {
    it('uses a stable version root key', () => {
        expect(queryKeys.version.all).toEqual([
            'version',
        ])
    })
})
