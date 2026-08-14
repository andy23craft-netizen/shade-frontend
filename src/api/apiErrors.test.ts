import {
    describe,
    expect,
    it,
} from 'vitest'
import {
    ApiError,
    formatApiQueryError,
    isApiError,
    isUnauthorizedQueryError,
    mapValidationFieldErrors,
} from './apiErrors'

describe('ApiError', () => {
    it('preserves safe API error metadata', () => {
        const error = new ApiError({
            kind: 'validation',
            status: 422,
            message: 'Request validation failed.',
            detail: 'Invalid request.',
            correlationId: 'request-123',
            fieldErrors: [
                {
                    field: 'title',
                    message: 'Field required',
                },
            ],
        })

        expect(isApiError(error)).toBe(true)
        expect(error.status).toBe(422)
        expect(error.detail).toBe('Invalid request.')
        expect(error.correlationId)
            .toBe('request-123')
        expect(error.fieldErrors).toEqual([
            {
                field: 'title',
                message: 'Field required',
            },
        ])
    })
})

describe('mapValidationFieldErrors', () => {
    it('maps FastAPI body locations to fields', () => {
        expect(
            mapValidationFieldErrors([
                {
                    loc: ['body', 'title'],
                    msg: 'Field required',
                    type: 'missing',
                },
                {
                    loc: ['body', 'rating'],
                    msg: 'Input should be less than or equal to 5',
                    type: 'less_than_equal',
                },
            ]),
        ).toEqual([
            {
                field: 'title',
                message: 'Field required',
            },
            {
                field: 'rating',
                message:
                    'Input should be less than or equal to 5',
            },
        ])
    })

    it('maps query locations to fields', () => {
        expect(
            mapValidationFieldErrors([
                {
                    loc: ['query', 'isbn'],
                    msg: 'Field required',
                    type: 'missing',
                },
            ]),
        ).toEqual([
            {
                field: 'isbn',
                message: 'Field required',
            },
        ])
    })

    it('ignores malformed validation entries', () => {
        expect(
            mapValidationFieldErrors([
                null,
                'bad',
                {},
                {
                    loc: ['body', 'title'],
                },
            ]),
        ).toEqual([])
    })

    it('returns no field errors for string detail', () => {
        expect(
            mapValidationFieldErrors(
                'ISBN is invalid',
            ),
        ).toEqual([])
    })
})

describe('formatApiQueryError', () => {
    it('returns the rejected-access message for unauthorized errors', () => {
        expect(
            formatApiQueryError(
                new ApiError({
                    kind: 'unauthorized',
                    status: 403,
                    message:
                        'Raw backend detail',
                }),
            ),
        ).toBe('API access was rejected.')
    })

    it('preserves other ApiError messages', () => {
        expect(
            formatApiQueryError(
                new ApiError({
                    kind: 'unreachable',
                    message:
                        'Unable to reach the Shade API.',
                }),
            ),
        ).toBe('Unable to reach the Shade API.')
    })

    it('falls back safely for unknown values', () => {
        expect(
            formatApiQueryError('unexpected'),
        ).toBe('An unexpected error occurred.')
    })
})

describe('isUnauthorizedQueryError', () => {
    it('detects unauthorized ApiError values', () => {
        expect(
            isUnauthorizedQueryError(
                new ApiError({
                    kind: 'unauthorized',
                    status: 403,
                    message:
                        'API access was rejected.',
                }),
            ),
        ).toBe(true)

        expect(
            isUnauthorizedQueryError(
                new Error('Network failure'),
            ),
        ).toBe(false)
    })
})
