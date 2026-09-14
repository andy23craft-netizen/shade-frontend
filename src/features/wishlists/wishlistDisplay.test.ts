import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    displayWishlistBookStatus,
    displayWishlistPriority,
    betterWorldBooksSearchUrl,
    safeHttpUrl,
} from './wishlistDisplay'

describe('displayWishlistBookStatus', () => {
    it('title-cases known membership statuses', () => {
        expect(displayWishlistBookStatus('wanted'))
            .toBe('Wanted')
        expect(displayWishlistBookStatus('ordered'))
            .toBe('Ordered')
    })

    it('marks unknown statuses safely', () => {
        expect(
            displayWishlistBookStatus('mystery'),
        ).toBe('mystery (unknown)')
    })
})

describe('displayWishlistPriority', () => {
    it('renders an em dash when priority is missing', () => {
        expect(displayWishlistPriority(null)).toBe('—')
        expect(displayWishlistPriority(undefined))
            .toBe('—')
    })

    it('renders numeric priority as text', () => {
        expect(displayWishlistPriority(2)).toBe('2')
    })
})

describe('safeHttpUrl', () => {
    it('returns absolute http(s) URLs', () => {
        expect(
            safeHttpUrl('https://example.com/book'),
        ).toBe('https://example.com/book')

        expect(
            safeHttpUrl('http://example.com/book'),
        ).toBe('http://example.com/book')
    })

    it('rejects blank, relative, and javascript URLs', () => {
        expect(safeHttpUrl('')).toBeNull()
        expect(safeHttpUrl('  ')).toBeNull()
        expect(safeHttpUrl(null)).toBeNull()
        expect(safeHttpUrl('/books/1')).toBeNull()
        expect(
            safeHttpUrl('javascript:alert(1)'),
        ).toBeNull()
    })
})

describe('betterWorldBooksSearchUrl', () => {
    it('searches by title and author when an ISBN is unavailable', () => {
        expect(betterWorldBooksSearchUrl({
            title: 'The Dispossessed',
            author: 'Ursula K. Le Guin',
        })).toBe('https://www.betterworldbooks.com/search/results?q=The%20Dispossessed%20Ursula%20K.%20Le%20Guin')
    })

    it('prefers an ISBN when one is provided', () => {
        expect(betterWorldBooksSearchUrl({
            title: 'The Dispossessed',
            author: 'Ursula K. Le Guin',
            isbn13: ' 9780061054884 ',
        })).toBe('https://www.betterworldbooks.com/search/results?q=9780061054884')
    })
})
