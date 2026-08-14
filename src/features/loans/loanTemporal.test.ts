import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    displayLoanDate,
    getLoanDueState,
} from './loanTemporal'

describe('displayLoanDate', () => {
    it('returns a fallback when no value was provided', () => {
        expect(
            displayLoanDate(null),
        ).toBe('Not provided')

        expect(
            displayLoanDate(undefined),
        ).toBe('Not provided')
    })

    it('formats a date-only value as a local calendar date', () => {
        const expected =
            new Intl.DateTimeFormat(
                undefined,
                {
                    dateStyle: 'medium',
                },
            ).format(
                new Date(
                    2026,
                    7,
                    14,
                ),
            )

        expect(
            displayLoanDate(
                '2026-08-14',
            ),
        ).toBe(expected)
    })

    it('formats a timestamp as a timestamp', () => {
        const value =
            '2026-08-14T18:30:00Z'

        expect(
            displayLoanDate(value),
        ).toBe(
            new Date(
                value,
            ).toLocaleString(),
        )
    })

    it('renders malformed legacy values safely', () => {
        expect(
            displayLoanDate(
                'not-a-date',
            ),
        ).toBe(
            'not-a-date (unrecognized date)',
        )
    })
})

describe('getLoanDueState', () => {
    it('returns no_due_date when no due date exists', () => {
        expect(
            getLoanDueState(
                null,
                new Date(
                    2026,
                    7,
                    14,
                    12,
                ),
            ),
        ).toBe('no_due_date')
    })

    it('treats a future date-only value as due', () => {
        expect(
            getLoanDueState(
                '2026-08-15',
                new Date(
                    2026,
                    7,
                    14,
                    23,
                    59,
                ),
            ),
        ).toBe('due')
    })

    it('treats a date-only value on the current local day as due today', () => {
        expect(
            getLoanDueState(
                '2026-08-14',
                new Date(
                    2026,
                    7,
                    14,
                    23,
                    59,
                ),
            ),
        ).toBe('due_today')
    })

    it('treats a past date-only value as overdue', () => {
        expect(
            getLoanDueState(
                '2026-08-13',
                new Date(
                    2026,
                    7,
                    14,
                    0,
                    1,
                ),
            ),
        ).toBe('overdue')
    })

    it('does not shift a date-only value across the local-day boundary', () => {
        expect(
            getLoanDueState(
                '2026-08-14',
                new Date(
                    2026,
                    7,
                    14,
                    0,
                    0,
                    1,
                ),
            ),
        ).toBe('due_today')

        expect(
            getLoanDueState(
                '2026-08-14',
                new Date(
                    2026,
                    7,
                    14,
                    23,
                    59,
                    59,
                ),
            ),
        ).toBe('due_today')
    })

    it('compares timestamps using their actual instant', () => {
        const now =
            new Date(
                '2026-08-14T18:00:00Z',
            )

        expect(
            getLoanDueState(
                '2026-08-14T17:59:59Z',
                now,
            ),
        ).toBe('overdue')

        expect(
            getLoanDueState(
                '2026-08-14T18:00:01Z',
                now,
            ),
        ).toBe('due')
    })

    it('does not invent an overdue state for a malformed value', () => {
        expect(
            getLoanDueState(
                'not-a-date',
                new Date(
                    2026,
                    7,
                    14,
                    12,
                ),
            ),
        ).toBe('unknown')
    })
})
