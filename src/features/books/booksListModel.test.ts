import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    BOOKS_BATCH_SIZE,
    parseCategoryIdParams,
    parseIsbnParam,
    parseSortByParam,
    parseSortOrderParam,
    parseTextFilterParam,
    sortByLabel,
    sortOrderLabel,
} from './booksListModel'

describe('booksListModel', () => {
    it('uses the shared infinite-scroll batch size', () => {
        expect(BOOKS_BATCH_SIZE).toBe(30)
    })

    it('normalizes invalid sort URL params', () => {
        expect(parseSortByParam(null)).toBe('author')
        expect(parseSortByParam('invalid')).toBe('author')
        expect(parseSortByParam('title')).toBe('title')
        expect(parseSortByParam('creationDate')).toBe('creationDate')
        expect(parseSortByParam('shelf')).toBe('shelf')

        expect(parseSortOrderParam(null)).toBe('asc')
        expect(parseSortOrderParam('invalid')).toBe('asc')
        expect(parseSortOrderParam('desc')).toBe('desc')
    })

    it('parses category_id URL params', () => {
        expect(
            parseCategoryIdParams([
                'cat-fiction',
                ' cat-religion ',
                'cat-fiction',
                '',
                '  ',
            ]),
        ).toEqual([
            'cat-fiction',
            'cat-religion',
        ])
    })

    it('returns an empty list when category_id params are blank', () => {
        expect(parseCategoryIdParams([])).toEqual([])
        expect(
            parseCategoryIdParams(['', '   ']),
        ).toEqual([])
    })

    it('trims text filter URL params', () => {
        expect(
            parseTextFilterParam('  Ursula K. Le Guin  '),
        ).toBe('Ursula K. Le Guin')

        expect(
            parseTextFilterParam('  Left Hand  '),
        ).toBe('Left Hand')
    })

    it('normalizes missing or blank text filter URL params', () => {
        expect(
            parseTextFilterParam(null),
        ).toBeUndefined()

        expect(
            parseTextFilterParam(''),
        ).toBeUndefined()

        expect(
            parseTextFilterParam('   '),
        ).toBeUndefined()
    })

    it('provides UI labels for sort options', () => {
        expect(sortByLabel('author')).toBe('Author')
        expect(sortByLabel('title')).toBe('Title')
        expect(sortByLabel('creationDate')).toBe('Date added')
        expect(sortByLabel('shelf')).toBe('Shelf')
        expect(sortOrderLabel('asc')).toBe('Ascending')
        expect(sortOrderLabel('desc')).toBe('Descending')
    })

    it('normalizes missing or blank ISBN URL params', () => {
        expect(
            parseIsbnParam(null),
        ).toBeUndefined()

        expect(
            parseIsbnParam(''),
        ).toBeUndefined()

        expect(
            parseIsbnParam('   '),
        ).toBeUndefined()

        expect(
            parseIsbnParam(' -._/ '),
        ).toBeUndefined()
    })

    it('preserves partial ISBN values for list filtering', () => {
        expect(
            parseIsbnParam('978044'),
        ).toBe('978044')

        expect(
            parseIsbnParam('978-044'),
        ).toBe('978044')
    })
})
