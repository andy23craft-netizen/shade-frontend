import {
    describe,
    expect,
    it,
} from 'vitest'
import {
    ApiError,
} from './apiErrors'
import {
    isBookIdentityError,
    isMalformedBookId,
} from './bookIdentity'

describe('bookIdentity', () => {
    it('treats 400 and 404 ApiErrors as book identity failures', () => {
        expect(
            isBookIdentityError(
                new ApiError({
                    kind: 'http',
                    status: 400,
                    message: 'Invalid id',
                }),
            ),
        ).toBe(true)

        expect(
            isBookIdentityError(
                new ApiError({
                    kind: 'http',
                    status: 404,
                    message: 'Book not found',
                }),
            ),
        ).toBe(true)
    })

    it('does not treat other failures as identity errors', () => {
        expect(
            isBookIdentityError(
                new ApiError({
                    kind: 'http',
                    status: 409,
                    message: 'Conflict',
                }),
            ),
        ).toBe(false)

        expect(
            isBookIdentityError(
                new Error('network'),
            ),
        ).toBe(false)
    })

    it('detects malformed non-empty book ids', () => {
        expect(isMalformedBookId('SL-0001'))
            .toBe(true)
        expect(isMalformedBookId('book-1'))
            .toBe(true)
        expect(isMalformedBookId(''))
            .toBe(false)
        expect(isMalformedBookId('   '))
            .toBe(false)
        expect(
            isMalformedBookId(
                '550e8400-e29b-41d4-a716-446655440000',
            ),
        ).toBe(false)
    })
})
