import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BackToTop } from './BackToTop'

describe('BackToTop', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        Object.defineProperty(window, 'scrollY', {
            configurable: true,
            value: 0,
        })
    })

    it('appears after meaningful movement and restores heading focus', () => {
        const scrollTo = vi.fn()
        const heading = document.createElement('h1')
        heading.tabIndex = -1
        document.body.append(heading)

        Object.defineProperty(window, 'scrollY', {
            configurable: true,
            value: 700,
        })
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: vi.fn().mockReturnValue({ matches: true }),
        })
        Object.defineProperty(window, 'scrollTo', {
            configurable: true,
            value: scrollTo,
        })
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
            (callback) => {
                callback(0)
                return 1
            },
        )

        render(<BackToTop />)
        fireEvent.click(screen.getByRole('button', { name: 'Back to top' }))

        expect(scrollTo).toHaveBeenCalledWith({
            top: 0,
            behavior: 'auto',
        })
        expect(heading).toHaveFocus()
        heading.remove()
    })

    it('stays hidden until its progressive surface is enabled', () => {
        Object.defineProperty(window, 'scrollY', {
            configurable: true,
            value: 700,
        })

        render(<BackToTop enabled={false} />)

        expect(screen.queryByRole('button', { name: 'Back to top' }))
            .not.toBeInTheDocument()
    })
})
