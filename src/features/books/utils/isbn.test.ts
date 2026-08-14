import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    compactIsbnForListFilter,
    isValidIsbn,
    isValidIsbn10,
    isValidIsbn13,
} from './isbn'

describe('ISBN validation', () => {
    describe('ISBN-10', () => {
        it('accepts a valid ISBN-10', () => {
            expect(
                isValidIsbn10(
                    '0441172717',
                ),
            ).toBe(true)
        })

        it('accepts a formatted ISBN-10', () => {
            expect(
                isValidIsbn10(
                    '0-441-17271-7',
                ),
            ).toBe(true)
        })

        it('accepts X as the ISBN-10 check digit', () => {
            expect(
                isValidIsbn10(
                    '043942089X',
                ),
            ).toBe(true)
        })

        it('rejects an invalid ISBN-10 check digit', () => {
            expect(
                isValidIsbn10(
                    '0441172718',
                ),
            ).toBe(false)
        })

        it('rejects malformed ISBN-10 values', () => {
            expect(
                isValidIsbn10(
                    '044117271',
                ),
            ).toBe(false)

            expect(
                isValidIsbn10(
                    'ABCDEFGHIJ',
                ),
            ).toBe(false)
        })
    })

    describe('ISBN-13', () => {
        it('accepts a valid ISBN-13', () => {
            expect(
                isValidIsbn13(
                    '9780441172719',
                ),
            ).toBe(true)
        })

        it('accepts a formatted ISBN-13', () => {
            expect(
                isValidIsbn13(
                    '978-0-441-17271-9',
                ),
            ).toBe(true)
        })

        it('rejects an invalid ISBN-13 check digit', () => {
            expect(
                isValidIsbn13(
                    '9780441172718',
                ),
            ).toBe(false)
        })

        it('rejects malformed ISBN-13 values', () => {
            expect(
                isValidIsbn13(
                    '978044117271',
                ),
            ).toBe(false)
        })
    })

    describe('isValidIsbn', () => {
        it('accepts ISBN-10', () => {
            expect(
                isValidIsbn(
                    '0441172717',
                ),
            ).toBe(true)
        })

        it('accepts ISBN-13', () => {
            expect(
                isValidIsbn(
                    '9780441172719',
                ),
            ).toBe(true)
        })

        it('rejects arbitrary text', () => {
            expect(
                isValidIsbn(
                    'not an isbn',
                ),
            ).toBe(false)
        })
    })

    describe('compactIsbnForListFilter', () => {
        it('strips spaces and hyphens without rewriting digits', () => {
            expect(
                compactIsbnForListFilter(
                    '978-0-441-17271-9',
                ),
            ).toBe('9780441172719')

            expect(
                compactIsbnForListFilter(
                    '0 441 17271 7',
                ),
            ).toBe('0441172717')
        })

        it('strips dots and slashes without adding prefix digits', () => {
            expect(
                compactIsbnForListFilter(
                    '978.0441/172719',
                ),
            ).toBe('9780441172719')
        })

        it('does not convert ISBN-10 into ISBN-13', () => {
            expect(
                compactIsbnForListFilter(
                    '0-441-17271-7',
                ),
            ).toBe('0441172717')
        })

        it('returns empty for whitespace-only input', () => {
            expect(
                compactIsbnForListFilter('   '),
            ).toBe('')
        })
    })
})
