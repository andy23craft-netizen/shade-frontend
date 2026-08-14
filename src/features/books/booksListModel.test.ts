import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    BOOKS_PAGE_SIZE,
    buildBooksListQuery,
    clampPage,
    formatBooksRange,
    pageToSkip,
    parsePageParam,
    parseSortByParam,
    parseSortOrderParam,
    skipToPage,
    sortByLabel,
    sortOrderLabel,
} from './booksListModel'

describe('booksListModel', () => {
    it('converts page to skip and back', () => {
        expect(pageToSkip(1)).toBe(0)
        expect(pageToSkip(2)).toBe(BOOKS_PAGE_SIZE)
        expect(skipToPage(0)).toBe(1)
        expect(skipToPage(BOOKS_PAGE_SIZE)).toBe(2)
    })

    it('builds paginated list query params', () => {
        expect(
            buildBooksListQuery({
                page: 3,
                sortBy: 'title',
                sortOrder: 'desc',
            }),
        ).toEqual({
            skip: 100,
            take: 50,
            sortBy: 'title',
            sortOrder: 'desc',
        })
    })

    it('normalizes invalid URL params', () => {
        expect(parsePageParam(null)).toBe(1)
        expect(parsePageParam('')).toBe(1)
        expect(parsePageParam('0')).toBe(1)
        expect(parsePageParam('-1')).toBe(1)
        expect(parsePageParam('abc')).toBe(1)
        expect(parsePageParam('2')).toBe(2)

        expect(parseSortByParam(null)).toBe('author')
        expect(parseSortByParam('invalid')).toBe('author')
        expect(parseSortByParam('title')).toBe('title')
        expect(parseSortByParam('creationDate')).toBe('creationDate')

        expect(parseSortOrderParam(null)).toBe('asc')
        expect(parseSortOrderParam('invalid')).toBe('asc')
        expect(parseSortOrderParam('desc')).toBe('desc')
    })

    it('clamps page to valid range', () => {
        expect(clampPage(5, 0)).toBe(1)
        expect(clampPage(0, 100)).toBe(1)
        expect(clampPage(1, 100)).toBe(1)
        expect(clampPage(3, 100)).toBe(2)
        expect(clampPage(2, 100)).toBe(2)
    })

    it('formats visible range text', () => {
        expect(formatBooksRange(0, 50, 237)).toBe(
            'Showing 1-50 of 237 books',
        )
        expect(formatBooksRange(50, 50, 237)).toBe(
            'Showing 51-100 of 237 books',
        )
        expect(formatBooksRange(0, 0, 0)).toBe(
            'Showing 0 books',
        )
    })

    it('provides UI labels for sort options', () => {
        expect(sortByLabel('author')).toBe('Author')
        expect(sortByLabel('title')).toBe('Title')
        expect(sortByLabel('creationDate')).toBe('Date added')
        expect(sortOrderLabel('asc')).toBe('Ascending')
        expect(sortOrderLabel('desc')).toBe('Descending')
    })
})
