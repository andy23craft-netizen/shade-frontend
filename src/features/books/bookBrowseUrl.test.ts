import { describe, expect, it } from 'vitest'

import {
    categoryBrowsePath,
    resolveCategoryBrowseToken,
    resolveShelfBrowseToken,
    shelfBrowsePath,
} from './bookBrowseUrl'

describe('bookBrowseUrl', () => {
    const categories = [
        { category_id: 'category-1', name: 'Science fiction', slug: 'sci-fi', created_date: '2026-01-01T00:00:00Z', updated_date: '2026-01-01T00:00:00Z' },
    ]
    const shelves = [
        { shelf_id: 'shelf-1', common_name: 'North Étagère', description: null, created_date: '2026-01-01T00:00:00Z', updated_date: '2026-01-01T00:00:00Z' },
    ]

    it('encodes human-readable route tokens', () => {
        expect(categoryBrowsePath('sci fi')).toBe('/books/category/sci%20fi')
        expect(shelfBrowsePath('North Étagère')).toBe('/books/shelf/North%20%C3%89tag%C3%A8re')
    })

    it('resolves case and Unicode-normalized tokens without deriving keys', () => {
        expect(resolveCategoryBrowseToken('SCI-FI', categories)?.category_id).toBe('category-1')
        expect(resolveShelfBrowseToken('north e\u0301tage\u0300re', shelves)?.shelf_id).toBe('shelf-1')
    })

    it('rejects unknown and ambiguous tokens', () => {
        expect(resolveCategoryBrowseToken('missing', categories)).toBeUndefined()
        expect(resolveShelfBrowseToken('same', [
            { ...shelves[0], shelf_id: 'one', common_name: 'Same' },
            { ...shelves[0], shelf_id: 'two', common_name: 'same' },
        ])).toBeUndefined()
    })
})
