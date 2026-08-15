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
