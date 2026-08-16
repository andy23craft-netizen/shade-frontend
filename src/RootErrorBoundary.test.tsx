import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    RouterProvider,
    createMemoryRouter,
} from 'react-router-dom'
import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'
import type { ReactNode } from 'react'

import { RootErrorBoundary } from './RootErrorBoundary'
import type {
    DiagnosticReporter,
} from './diagnostics/diagnosticReporter'

function Thrower(): ReactNode {
    throw new Error('SECRET INTERNAL ERROR')
}

function createReporter(): DiagnosticReporter {
    return {
        reportApiFailure: vi.fn(),
        reportRenderFailure: vi.fn(),
    }
}

function renderBoundary(
    diagnosticReporter = createReporter(),
) {
    const router = createMemoryRouter([
        {
            path: '*',
            element: (
                <RootErrorBoundary
                    diagnosticReporter={
                        diagnosticReporter
                    }
                >
                    <Thrower />
                </RootErrorBoundary>
            ),
        },
    ])

    render(
        <RouterProvider router={router} />,
    )

    return {
        router,
        diagnosticReporter,
    }
}

describe('RootErrorBoundary', () => {
    it('shows a generic recovery screen without exposing error details', () => {
        renderBoundary()

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Something went wrong',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Try again',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', {
                name: 'Return home',
            }),
        ).toHaveAttribute('href', '/')

        expect(
            screen.queryByText(
                'SECRET INTERNAL ERROR',
            ),
        ).not.toBeInTheDocument()
    })

    it('reports the render failure without passing raw error details', () => {
        const diagnosticReporter =
            createReporter()

        renderBoundary(
            diagnosticReporter,
        )

        expect(
            diagnosticReporter.reportRenderFailure,
        ).toHaveBeenCalledOnce()

        expect(
            diagnosticReporter.reportRenderFailure,
        ).toHaveBeenCalledWith()
    })

    it('does not report the render failure through the API failure path', () => {
        const diagnosticReporter =
            createReporter()

        renderBoundary(
            diagnosticReporter,
        )

        expect(
            diagnosticReporter.reportApiFailure,
        ).not.toHaveBeenCalled()
    })

    it('provides a retry action', () => {
        renderBoundary()

        const retryButton =
            screen.getByRole('button', {
                name: 'Try again',
            })

        expect(retryButton).toBeEnabled()

        fireEvent.click(retryButton)

        expect(
            screen.getByRole('heading', {
                name: 'Something went wrong',
            }),
        ).toBeInTheDocument()
    })
})
