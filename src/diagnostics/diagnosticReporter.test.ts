import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { ApiError } from '../api/apiErrors'
import {
    createDiagnosticReporter,
} from './diagnosticReporter'

describe('createDiagnosticReporter', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('does not send reports when diagnostics are disabled', () => {
        const fetchMock = vi.spyOn(
            globalThis,
            'fetch',
        )

        const reporter =
            createDiagnosticReporter({
                config: {
                    enabled: false,
                    endpoint: null,
                },
                release: '2026.08.16',
            })

        reporter.reportApiFailure(
            new ApiError({
                kind: 'server',
                status: 500,
                message: 'Server failed.',
            }),
            'books.list',
        )

        reporter.reportRenderFailure()

        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('sends an allowlisted API failure diagnostic', async () => {
        const fetchMock = vi.spyOn(
            globalThis,
            'fetch',
        ).mockResolvedValue(
            new Response(null, {
                status: 204,
            }),
        )

        const reporter =
            createDiagnosticReporter({
                config: {
                    enabled: true,
                    endpoint:
                        'https://diagnostics.example.test/report',
                },
                release: '2026.08.16',
            })

        reporter.reportApiFailure(
            new ApiError({
                kind: 'server',
                status: 500,
                message:
                    'Private server message.',
                detail:
                    'Borrower Pat has private notes.',
                fieldErrors: [
                    {
                        field: 'isbn',
                        message:
                            '9780000000000',
                    },
                ],
            }),
            'books.list',
        )

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce()
        })

        expect(fetchMock).toHaveBeenCalledWith(
            'https://diagnostics.example.test/report',
            {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json',
                },
                body: JSON.stringify({
                    event:
                        'api_request_failure',
                    release: '2026.08.16',
                    operation: 'books.list',
                    error: {
                        kind: 'server',
                        status: 500,
                    },
                }),
                credentials: 'omit',
            },
        )

        const requestOptions =
            fetchMock.mock.calls[0]?.[1]

        expect(
            requestOptions?.body,
        ).not.toContain(
            'Private server message.',
        )

        expect(
            requestOptions?.body,
        ).not.toContain('Pat')

        expect(
            requestOptions?.body,
        ).not.toContain('isbn')

        expect(
            requestOptions?.body,
        ).not.toContain('9780000000000')
    })

    it('includes a correlation ID only when it already exists on ApiError', async () => {
        const fetchMock = vi.spyOn(
            globalThis,
            'fetch',
        ).mockResolvedValue(
            new Response(null, {
                status: 204,
            }),
        )

        const reporter =
            createDiagnosticReporter({
                config: {
                    enabled: true,
                    endpoint:
                        'https://diagnostics.example.test/report',
                },
                release: '2026.08.16',
            })

        reporter.reportApiFailure(
            new ApiError({
                kind: 'http',
                status: 409,
                message: 'Conflict.',
                correlationId:
                    'backend-request-123',
            }),
            'books.checkout',
        )

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce()
        })

        expect(
            fetchMock.mock.calls[0]?.[1]?.body,
        ).toBe(
            JSON.stringify({
                event: 'api_request_failure',
                release: '2026.08.16',
                operation: 'books.checkout',
                error: {
                    kind: 'http',
                    status: 409,
                    correlationId:
                        'backend-request-123',
                },
            }),
        )
    })

    it('does not fabricate a correlation ID', async () => {
        const fetchMock = vi.spyOn(
            globalThis,
            'fetch',
        ).mockResolvedValue(
            new Response(null, {
                status: 204,
            }),
        )

        const reporter =
            createDiagnosticReporter({
                config: {
                    enabled: true,
                    endpoint:
                        'https://diagnostics.example.test/report',
                },
                release: '2026.08.16',
            })

        reporter.reportApiFailure(
            new ApiError({
                kind: 'unreachable',
                message:
                    'Unable to reach the Shade API.',
            }),
        )

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce()
        })

        const body = String(
            fetchMock.mock.calls[0]?.[1]?.body,
        )

        expect(body).not.toContain(
            'correlationId',
        )
    })

    it('sends a render failure without raw error details', async () => {
        const fetchMock = vi.spyOn(
            globalThis,
            'fetch',
        ).mockResolvedValue(
            new Response(null, {
                status: 204,
            }),
        )

        const reporter =
            createDiagnosticReporter({
                config: {
                    enabled: true,
                    endpoint:
                        'https://diagnostics.example.test/report',
                },
                release: '2026.08.16',
            })

        reporter.reportRenderFailure()

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce()
        })

        expect(
            fetchMock.mock.calls[0]?.[1]?.body,
        ).toBe(
            JSON.stringify({
                event: 'render_failure',
                release: '2026.08.16',
            }),
        )
    })

    it('swallows diagnostic transport failures', async () => {
        vi.spyOn(
            globalThis,
            'fetch',
        ).mockRejectedValue(
            new TypeError(
                'Diagnostic endpoint unavailable',
            ),
        )

        const reporter =
            createDiagnosticReporter({
                config: {
                    enabled: true,
                    endpoint:
                        'https://diagnostics.example.test/report',
                },
                release: '2026.08.16',
            })

        expect(() => {
            reporter.reportRenderFailure()
        }).not.toThrow()

        await Promise.resolve()
    })

    it('drops an unsafe diagnostic without throwing or sending it', () => {
        const fetchMock = vi.spyOn(
            globalThis,
            'fetch',
        )

        const reporter =
            createDiagnosticReporter({
                config: {
                    enabled: true,
                    endpoint:
                        'https://diagnostics.example.test/report',
                },
                release: '2026.08.16',
            })

        expect(() => {
            reporter.reportApiFailure(
                new ApiError({
                    kind: 'server',
                    status: 500,
                    message: 'Server failed.',
                    correlationId:
                        'Bearer secret-token',
                }),
                'books.list',
            )
        }).not.toThrow()

        expect(fetchMock).not.toHaveBeenCalled()
    })
})
