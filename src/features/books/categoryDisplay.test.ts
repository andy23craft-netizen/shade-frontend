import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    BookCategoryRead,
    CategoryRead,
} from '../../api/apiTypes'
import {
    categoryIdsEqual,
    formatBookCategories,
    sortCategoriesByName,
} from './categoryDisplay'

const fiction: BookCategoryRead = {
    category_id: 'cat-fiction',
    name: 'Fiction',
    slug: 'fiction',
}

const religion: BookCategoryRead = {
    category_id: 'cat-religion',
    name: 'Religion',
    slug: 'religion',
}

describe('formatBookCategories', () => {
    it('returns None for missing or empty categories', () => {
        expect(formatBookCategories(undefined)).toBe(
            'None',
        )
        expect(formatBookCategories(null)).toBe(
            'None',
        )
        expect(formatBookCategories([])).toBe(
            'None',
        )
    })

    it('joins category names', () => {
        expect(
            formatBookCategories([
                fiction,
                religion,
            ]),
        ).toBe('Fiction, Religion')
    })
})

describe('categoryIdsEqual', () => {
    it('compares ids regardless of order', () => {
        expect(
            categoryIdsEqual(
                ['a', 'b'],
                ['b', 'a'],
            ),
        ).toBe(true)

        expect(
            categoryIdsEqual(['a'], ['a', 'b']),
        ).toBe(false)

        expect(
            categoryIdsEqual(['a'], ['b']),
        ).toBe(false)
    })
})

describe('sortCategoriesByName', () => {
    it('sorts categories by name case-insensitively', () => {
        const categories: CategoryRead[] = [
            {
                category_id: '2',
                name: 'zeta',
                slug: 'zeta',
                created_date: '2026-01-01T00:00:00Z',
                updated_date: '2026-01-01T00:00:00Z',
            },
            {
                category_id: '1',
                name: 'Alpha',
                slug: 'alpha',
                created_date: '2026-01-01T00:00:00Z',
                updated_date: '2026-01-01T00:00:00Z',
            },
        ]

        expect(
            sortCategoriesByName(categories).map(
                (category) => category.name,
            ),
        ).toEqual([
            'Alpha',
            'zeta',
        ])
    })
})
