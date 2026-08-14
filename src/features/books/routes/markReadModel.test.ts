import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    markReadFormDefaults,
    markReadFormValuesToRequest,
    validateMarkReadFormValues,
} from './markReadModel'

describe('markReadModel', () => {
    describe('validateMarkReadFormValues', () => {
        it('accepts all optional fields as blank', () => {
            expect(
                validateMarkReadFormValues(
                    markReadFormDefaults,
                ),
            ).toEqual({})
        })

        it('accepts a valid completion date', () => {
            expect(
                validateMarkReadFormValues({
                    ...markReadFormDefaults,
                    completion_date: '2026-08-14',
                }),
            ).toEqual({})
        })

        it('rejects a completion date that is not YYYY-MM-DD', () => {
            expect(
                validateMarkReadFormValues({
                    ...markReadFormDefaults,
                    completion_date: 'August 14, 2026',
                }),
            ).toEqual({
                completion_date:
                    'Enter a valid completion date.',
            })
        })

        it('rejects an impossible calendar date', () => {
            expect(
                validateMarkReadFormValues({
                    ...markReadFormDefaults,
                    completion_date: '2026-02-30',
                }),
            ).toEqual({
                completion_date:
                    'Enter a valid completion date.',
            })
        })

        it.each([
            '1',
            '2',
            '3',
            '4',
            '5',
        ])(
            'accepts rating %s',
            (rating) => {
                expect(
                    validateMarkReadFormValues({
                        ...markReadFormDefaults,
                        rating,
                    }),
                ).toEqual({})
            },
        )

        it.each([
            '0',
            '6',
            '100',
        ])(
            'rejects out-of-range rating %s',
            (rating) => {
                expect(
                    validateMarkReadFormValues({
                        ...markReadFormDefaults,
                        rating,
                    }),
                ).toEqual({
                    rating:
                        'Rating must be from 1 through 5.',
                })
            },
        )

        it.each([
            '1.5',
            'abc',
            '-1',
        ])(
            'rejects non-integer rating %s',
            (rating) => {
                expect(
                    validateMarkReadFormValues({
                        ...markReadFormDefaults,
                        rating,
                    }),
                ).toEqual({
                    rating:
                        'Rating must be a whole number from 1 through 5.',
                })
            },
        )
    })

    describe('markReadFormValuesToRequest', () => {
        it('returns an empty request when all optionals are blank', () => {
            expect(
                markReadFormValuesToRequest(
                    markReadFormDefaults,
                ),
            ).toEqual({})
        })

        it('serializes supplied reading fields', () => {
            expect(
                markReadFormValuesToRequest({
                    completion_date: '2026-08-14',
                    rating: '5',
                    review: 'Excellent book.',
                }),
            ).toEqual({
                completion_date: '2026-08-14',
                rating: 5,
                review: 'Excellent book.',
            })
        })

        it('omits blank optional fields', () => {
            expect(
                markReadFormValuesToRequest({
                    completion_date: '',
                    rating: '4',
                    review: '',
                }),
            ).toEqual({
                rating: 4,
            })
        })

        it('trims form input before serialization', () => {
            expect(
                markReadFormValuesToRequest({
                    completion_date:
                        ' 2026-08-14 ',
                    rating: ' 3 ',
                    review: ' A good read. ',
                }),
            ).toEqual({
                completion_date: '2026-08-14',
                rating: 3,
                review: 'A good read.',
            })
        })
    })
})
