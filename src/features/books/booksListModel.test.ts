import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    BOOKS_BATCH_SIZE,
    parseSortByParam,
    parseSortOrderParam,
    sortByLabel,
    sortOrderLabel,
} from './booksListModel'

describe('booksListModel', () => {
    it('uses the shared infinite-scroll batch size', () => {
        expect(BOOKS_BATCH_SIZE).toBe(30)
    })

    it('normalizes invalid URL params', () => {
        expect(parseSortByParam(null)).toBe('author')
        expect(parseSortByParam('invalid')).toBe('author')
        expect(parseSortByParam('title')).toBe('title')
        expect(parseSortByParam('creationDate')).toBe('creationDate')
        expect(parseSortByParam('shelf')).toBe('shelf')

        expect(parseSortOrderParam(null)).toBe('asc')
        expect(parseSortOrderParam('invalid')).toBe('asc')
        expect(parseSortOrderParam('desc')).toBe('desc')
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
