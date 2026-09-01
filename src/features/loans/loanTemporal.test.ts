import { describe, expect, it } from 'vitest'
import { displayLoanDate } from './loanTemporal'

describe('displayLoanDate', () => {
    it('returns a fallback when no value was provided', () => {
        expect(displayLoanDate(null)).toBe('Not provided')
        expect(displayLoanDate(undefined)).toBe('Not provided')
    })

    it('formats a date-only value as a local calendar date', () => {
        const expected = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
            .format(new Date(2026, 7, 14))
        expect(displayLoanDate('2026-08-14')).toBe(expected)
    })

    it('formats a timestamp as a timestamp', () => {
        const value = '2026-08-14T18:30:00Z'
        expect(displayLoanDate(value)).toBe(new Date(value).toLocaleString())
    })

    it('renders malformed legacy values safely', () => {
        expect(displayLoanDate('not-a-date')).toBe('not-a-date (unrecognized date)')
    })
})
