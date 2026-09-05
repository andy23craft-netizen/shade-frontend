import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    checkinFormValuesToRequest,
    checkinFormDefaults,
    validateCheckinFormValues,
} from './checkinModel'

describe('checkinFormDefaults', () => {
    it('starts with an empty rating and return date', () => {
        expect(checkinFormDefaults).toEqual({
            rating: '',
            returned_at: '',
        })
    })
})

describe('validateCheckinFormValues', () => {
    it('accepts an empty return date', () => {
        expect(
            validateCheckinFormValues({
                rating: '5', returned_at: '',
            }),
        ).toEqual({})
    })

    it('accepts a valid return date and time', () => {
        expect(
            validateCheckinFormValues({
                rating: '4', returned_at:
                    '2026-08-13T15:30',
            }),
        ).toEqual({})
    })

    it('rejects an invalid return date and time', () => {
        expect(
            validateCheckinFormValues({
                rating: '3', returned_at:
                    'not-a-date',
            }),
        ).toEqual({
            returned_at:
                'Enter a valid return date and time.',
        })
    })

    it('rejects an impossible return date', () => {
        expect(
            validateCheckinFormValues({
                rating: '2', returned_at:
                    '2026-02-30T15:30',
            }),
        ).toEqual({
            returned_at:
                'Enter a valid return date and time.',
        })
    })

    it('requires an integer rating from 1 through 5', () => {
        expect(validateCheckinFormValues({ rating: '', returned_at: '' })).toEqual({ rating: 'Choose a rating from 1 to 5.' })
        expect(validateCheckinFormValues({ rating: '6', returned_at: '' })).toEqual({ rating: 'Choose a rating from 1 to 5.' })
    })
})

describe('checkinFormValuesToRequest', () => {
    it('sends the rating when no return date is provided', () => {
        expect(
            checkinFormValuesToRequest({
                rating: '5', returned_at: '',
            }),
        ).toEqual({ rating: 5 })
    })

    it('normalizes a supplied return date to UTC ISO 8601', () => {
        expect(
            checkinFormValuesToRequest({
                rating: '4', returned_at:
                    '2026-08-13T15:30',
            }),
        ).toEqual({
            rating: 4,
            returned_at:
                new Date(
                    2026,
                    7,
                    13,
                    15,
                    30,
                ).toISOString(),
        })
    })

    it('trims whitespace before checking for an empty value', () => {
        expect(
            checkinFormValuesToRequest({
                rating: '3', returned_at: '   ',
            }),
        ).toEqual({ rating: 3 })
    })
})
