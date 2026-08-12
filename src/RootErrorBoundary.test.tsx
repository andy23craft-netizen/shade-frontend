import { fireEvent, render, screen } from '@testing-library/react'
import {
    RouterProvider,
} from 'react-router-dom'
import { createMemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { RootErrorBoundary } from './RootErrorBoundary'
import type { ReactNode } from 'react'

function Thrower(): ReactNode {
    throw new Error('SECRET INTERNAL ERROR')
}

function renderBoundary() {
    const router = createMemoryRouter([
        {
            path: '*',
            element: (
                <RootErrorBoundary>
                    <Thrower />
                </RootErrorBoundary>
            ),
        },
    ])

    render(<RouterProvider router={router} />)

    return router
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
            screen.queryByText('SECRET INTERNAL ERROR'),
        ).not.toBeInTheDocument()
    })

    it('provides a retry action', () => {
        renderBoundary()

        const retryButton = screen.getByRole('button', {
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
