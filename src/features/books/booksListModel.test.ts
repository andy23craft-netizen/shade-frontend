import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    BOOKS_BATCH_SIZE,
    CATEGORY_FILTER_VALUES,
    parseCategoryParam,
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

    it('parses valid category URL params', () => {
        expect(parseCategoryParam('fiction')).toBe('fiction')
        expect(parseCategoryParam('religion')).toBe('religion')
        expect(parseCategoryParam('unknown')).toBe('unknown')
    })

    it('normalizes missing or invalid category URL params', () => {
        expect(parseCategoryParam(null)).toBeUndefined()
        expect(parseCategoryParam('')).toBeUndefined()
        expect(parseCategoryParam('invalid')).toBeUndefined()
    })

    it('provides every supported category filter value', () => {
        expect(CATEGORY_FILTER_VALUES).toEqual([
            'unknown',
            'religion',
            'philosophy',
            'fiction',
            'nonfiction',
        ])
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
})
