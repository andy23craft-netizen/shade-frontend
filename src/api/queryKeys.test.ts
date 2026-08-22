import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    queryKeys,
} from './queryKeys'

describe('queryKeys.books list filters', () => {
    it('omits blank and whitespace author, title, categoryIds, and isbn', () => {
        expect(
            queryKeys.books.list({
                isbn: '  ',
                author: '',
                title: '\t',
                categoryIds: ['   ', ''],
            }),
        ).toEqual([
            'books',
            {
                includeDeleted: false,
            },
        ])
    })

    it('includes trimmed author, title, and categoryIds in list keys', () => {
        expect(
            queryKeys.books.list({
                author: '  Le Guin  ',
                title: ' Darkness ',
                categoryIds: [' fiction ', 'religion'],
            }),
        ).toEqual([
            'books',
            {
                includeDeleted: false,
                author: 'Le Guin',
                title: 'Darkness',
                categoryIds: ['fiction', 'religion'],
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

describe('queryKeys.categories', () => {
    it('uses an unpaginated list key under the categories prefix', () => {
        expect(queryKeys.categories.all).toEqual([
            'categories',
        ])

        expect(queryKeys.categories.list()).toEqual([
            'categories',
            {
                list: true,
            },
        ])
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

describe('queryKeys.collections', () => {
    it('uses unpaginated list and books keys under the collections prefix', () => {
        expect(queryKeys.collections.all).toEqual([
            'collections',
        ])

        expect(queryKeys.collections.list()).toEqual([
            'collections',
            {
                list: true,
            },
        ])

        expect(
            queryKeys.collections.books('collection-1'),
        ).toEqual([
            'collections',
            'collection-1',
            'books',
        ])
    })

    it('isolates collections keys from books, shelves, and wishlists', () => {
        expect(
            queryKeys.collections.list()[0],
        ).not.toBe(queryKeys.books.all[0])

        expect(
            queryKeys.collections.list()[0],
        ).not.toBe(queryKeys.shelves.all[0])

        expect(
            queryKeys.collections.list()[0],
        ).not.toBe(queryKeys.wishlists.all[0])

        expect(
            queryKeys.collections.books('collection-1'),
        ).not.toEqual(
            queryKeys.collections.books('collection-2'),
        )
    })
})

describe('queryKeys.version', () => {
    it('uses a stable version root key', () => {
        expect(queryKeys.version.all).toEqual([
            'version',
        ])
    })
})
