import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    homeCategoryHref,
    topHomeCategories,
} from './homeDiscoveryModel'

describe('homeDiscoveryModel', () => {
    const categories = [
        {
            category_id: 'cat-philosophy',
            name: 'Philosophy',
        },
        {
            category_id: 'cat-fantasy',
            name: 'Fantasy',
        },
        {
            category_id: 'cat-poetry',
            name: 'Poetry',
        },
        {
            category_id: 'cat-history',
            name: 'History',
        },
        {
            category_id: 'cat-religion',
            name: 'Religion',
        },
        {
            category_id: 'cat-science',
            name: 'Science',
        },
    ]

    it('returns the five largest populated categories', () => {
        const result = topHomeCategories(
            [
                {
                    key: 'Philosophy',
                    count: 18,
                },
                {
                    key: 'Fantasy',
                    count: 42,
                },
                {
                    key: 'Poetry',
                    count: 11,
                },
                {
                    key: 'History',
                    count: 27,
                },
                {
                    key: 'Religion',
                    count: 31,
                },
                {
                    key: 'Science',
                    count: 14,
                },
                {
                    key: 'Empty',
                    count: 0,
                },
            ],
            categories,
        )

        expect(result).toEqual([
            {
                categoryId: 'cat-fantasy',
                name: 'Fantasy',
                count: 42,
            },
            {
                categoryId: 'cat-religion',
                name: 'Religion',
                count: 31,
            },
            {
                categoryId: 'cat-history',
                name: 'History',
                count: 27,
            },
            {
                categoryId: 'cat-philosophy',
                name: 'Philosophy',
                count: 18,
            },
            {
                categoryId: 'cat-science',
                name: 'Science',
                count: 14,
            },
        ])
    })

    it('skips unresolved category buckets before applying the limit', () => {
        const result = topHomeCategories(
            [
                {
                    key: 'Missing',
                    count: 100,
                },
                {
                    key: 'Fantasy',
                    count: 42,
                },
                {
                    key: 'Religion',
                    count: 31,
                },
            ],
            categories,
        )

        expect(
            result.map(
                (category) => category.name,
            ),
        ).toEqual([
            'Fantasy',
            'Religion',
        ])
    })

    it('uses category name as a stable tie-breaker', () => {
        const result = topHomeCategories(
            [
                {
                    key: 'Poetry',
                    count: 10,
                },
                {
                    key: 'Fantasy',
                    count: 10,
                },
            ],
            categories,
        )

        expect(
            result.map(
                (category) => category.name,
            ),
        ).toEqual([
            'Fantasy',
            'Poetry',
        ])
    })

    it('builds the canonical Books category URL', () => {
        expect(
            homeCategoryHref('cat-fiction'),
        ).toBe(
            '/books?category_id=cat-fiction',
        )
    })
})
