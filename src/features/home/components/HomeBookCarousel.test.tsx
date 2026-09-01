import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HomeBookCarousel } from './HomeBookCarousel'

function setReducedMotion(matches: boolean) {
    Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: vi.fn().mockReturnValue({ matches }),
    })
}

function renderCarousel() {
    const result = render(
        <HomeBookCarousel ariaLabel="New additions books">
            <li>First</li><li>Second</li><li>Third</li>
        </HomeBookCarousel>,
    )
    const list = screen.getByRole('list', { name: 'New additions books' })
    const scrollBy = vi.fn()
    const scrollTo = vi.fn()
    Object.defineProperties(list, {
        clientWidth: { configurable: true, value: 300 },
        scrollWidth: { configurable: true, value: 900 },
        scrollLeft: { configurable: true, writable: true, value: 0 },
        scrollBy: { configurable: true, value: scrollBy },
        scrollTo: { configurable: true, value: scrollTo },
    })
    fireEvent.scroll(list)
    return { ...result, list, scrollBy, scrollTo }
}

describe('HomeBookCarousel', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        setReducedMotion(false)
    })
    afterEach(() => {
        vi.clearAllTimers()
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('uses actual scroll boundaries and has no numeric position', () => {
        const { list, scrollBy } = renderCarousel()
        const previous = screen.getByRole('button', { name: 'Previous New additions books' })
        const next = screen.getByRole('button', { name: 'Next New additions books' })
        expect(previous).toBeDisabled()
        expect(next).toBeEnabled()
        expect(screen.queryByText(/1 \/ 3/)).not.toBeInTheDocument()
        fireEvent.click(next)
        expect(scrollBy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' })
        Object.defineProperty(list, 'scrollLeft', { configurable: true, value: 600 })
        fireEvent.scroll(list)
        expect(previous).toBeEnabled()
        expect(next).toBeDisabled()
    })

    it('updates controls after manual scrolling', () => {
        const { list } = renderCarousel()
        Object.defineProperty(list, 'scrollLeft', { configurable: true, value: 250 })
        fireEvent.scroll(list)
        expect(screen.getByRole('button', { name: 'Previous New additions books' })).toBeEnabled()
        expect(screen.getByRole('button', { name: 'Next New additions books' })).toBeEnabled()
    })

    it('auto-advances and honors reduced motion', () => {
        const first = renderCarousel()
        act(() => vi.advanceTimersByTime(5000))
        expect(first.scrollBy).toHaveBeenCalled()
        first.unmount()
        vi.clearAllTimers()
        setReducedMotion(true)
        const second = renderCarousel()
        act(() => vi.advanceTimersByTime(10000))
        expect(second.scrollBy).not.toHaveBeenCalled()
    })

    it('cleans up interaction timers when unmounted', () => {
        const clearTimeout = vi.spyOn(window, 'clearTimeout')
        const { list, unmount } = renderCarousel()
        fireEvent.pointerDown(list)
        unmount()
        expect(clearTimeout).toHaveBeenCalled()
    })
})
