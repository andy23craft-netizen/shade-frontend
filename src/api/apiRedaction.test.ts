import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    ApiError,
} from './apiErrors'
import {
    assertSafeApiDiagnostic,
    serializeSafeApiErrorDiagnostic,
    toSafeApiErrorDiagnostic,
} from './apiRedaction'

describe('apiRedaction', () => {
    it('projects ApiError into a safe diagnostic shape', () => {
        const error = new ApiError({
            kind: 'validation',
            status: 422,
            message: 'Request validation failed.',
            detail: 'Invalid request.',
            correlationId: undefined,
            fieldErrors: [
                {
                    field: 'title',
                    message: 'Field required',
                },
            ],
        })

        expect(
            toSafeApiErrorDiagnostic(error),
        ).toEqual({
            name: 'ApiError',
            kind: 'validation',
            status: 422,
            message: 'Request validation failed.',
            detail: 'Invalid request.',
            correlationId: undefined,
            fieldErrors: [
                {
                    field: 'title',
                    message: 'Field required',
                },
            ],
        })
    })

    it('rejects diagnostics that retain sensitive keys or values', () => {
        expect(() =>
            assertSafeApiDiagnostic({
                authorization: 'Bearer secret',
            }),
        ).toThrow(
            /sensitive/i,
        )

        expect(() =>
            assertSafeApiDiagnostic({
                summary:
                    'Authorization: Bearer leaked',
            }),
        ).toThrow(
            /sensitive/i,
        )

        expect(() =>
            assertSafeApiDiagnostic({
                body: 'CREATE TABLE books',
                filename: 'backup.sql',
            }),
        ).toThrow(
            /sensitive/i,
        )

        expect(() =>
            assertSafeApiDiagnostic({
                borrower: 'Pat',
                notes: 'private',
                review: 'private',
                isbn: '9780000000000',
            }),
        ).toThrow(
            /sensitive/i,
        )
    })

    it('accepts safe ApiError diagnostics for logging', () => {
        const error = new ApiError({
            kind: 'http',
            status: 409,
            message: 'Book state conflict.',
            detail: 'Book state conflict.',
            fieldErrors: [
                {
                    field: 'isbn',
                    message: 'Invalid ISBN',
                },
            ],
        })

        const diagnostic =
            toSafeApiErrorDiagnostic(error)

        expect(() =>
            assertSafeApiDiagnostic(diagnostic),
        ).not.toThrow()

        expect(() =>
            assertSafeApiDiagnostic(
                serializeSafeApiErrorDiagnostic(
                    error,
                ),
            ),
        ).not.toThrow()
    })
})
