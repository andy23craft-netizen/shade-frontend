import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    formatDateOnly,
    formatUtcIso8601,
    isDateOnlyString,
    normalizeUtcIso8601,
} from './dateTime'

describe('dateTime helpers', () => {
    it('formats local calendar dates as YYYY-MM-DD', () => {
        const date = new Date(2026, 7, 11)

        expect(formatDateOnly(date)).toBe(
            '2026-08-11',
        )
    })

    it('formats UTC ISO 8601 timestamps', () => {
        const date = new Date(
            '2026-08-11T15:30:00.000Z',
        )

        expect(formatUtcIso8601(date)).toBe(
            '2026-08-11T15:30:00.000Z',
        )
    })

    it('validates date-only strings', () => {
        expect(
            isDateOnlyString('2026-08-11'),
        ).toBe(true)
        expect(
            isDateOnlyString('2026-02-30'),
        ).toBe(false)
        expect(
            isDateOnlyString(
                '2026-08-11T00:00:00Z',
            ),
        ).toBe(false)
    })

    it('normalizes parseable timestamps to UTC ISO 8601', () => {
        expect(
            normalizeUtcIso8601(
                '2026-08-11T15:30:00+00:00',
            ),
        ).toBe('2026-08-11T15:30:00.000Z')

        expect(() =>
            normalizeUtcIso8601('not-a-date'),
        ).toThrow(RangeError)
    })
})
