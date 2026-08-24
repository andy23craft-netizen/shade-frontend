import {
    act,
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    HomeBookCarousel,
} from './HomeBookCarousel'

function setReducedMotion(
    matches: boolean,
) {
    Object.defineProperty(
        window,
        'matchMedia',
        {
            configurable: true,
            writable: true,
            value: vi.fn().mockReturnValue({
                matches,
                media:
                    '(prefers-reduced-motion: reduce)',
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }),
        },
    )
}

function renderCarousel() {
    const result = render(
        <HomeBookCarousel ariaLabel="New additions books">
            <li>First</li>
            <li>Second</li>
            <li>Third</li>
        </HomeBookCarousel>,
    )

    const list = screen.getByRole(
        'list',
        {
            name: 'New additions books',
        },
    )

    const scrollTo = vi.fn()

    Object.defineProperty(
        list,
        'scrollTo',
        {
            configurable: true,
            value: scrollTo,
        },
    )

    Array.from(list.children).forEach(
        (child, index) => {
            Object.defineProperty(
                child,
                'offsetLeft',
                {
                    configurable: true,
                    value: index * 200,
                },
            )
        },
    )

    return {
        ...result,
        list,
        scrollTo,
    }
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

    it('moves forward and backward with the controls', () => {
        const {
            scrollTo,
        } = renderCarousel()

        expect(
            screen.getByText('1 / 3'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Next New additions books',
            }),
        )

        expect(
            screen.getByText('2 / 3'),
        ).toBeInTheDocument()

        expect(scrollTo).toHaveBeenCalledWith({
            left: 200,
            behavior: 'smooth',
        })

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previous New additions books',
            }),
        )

        expect(
            screen.getByText('1 / 3'),
        ).toBeInTheDocument()

        expect(scrollTo).toHaveBeenCalledWith({
            left: 0,
            behavior: 'smooth',
        })
    })

    it('wraps from the first item to the last', () => {
        const {
            scrollTo,
        } = renderCarousel()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previous New additions books',
            }),
        )

        expect(
            screen.getByText('3 / 3'),
        ).toBeInTheDocument()

        expect(scrollTo).toHaveBeenCalledWith({
            left: 400,
            behavior: 'smooth',
        })
    })

    it('automatically advances through the carousel', () => {
        const {
            scrollTo,
        } = renderCarousel()

        act(() => {
            vi.advanceTimersByTime(5000)
        })

        expect(
            screen.getByText('2 / 3'),
        ).toBeInTheDocument()

        expect(scrollTo).toHaveBeenCalledWith({
            left: 200,
            behavior: 'smooth',
        })

        act(() => {
            vi.advanceTimersByTime(5000)
        })

        expect(
            screen.getByText('3 / 3'),
        ).toBeInTheDocument()

        act(() => {
            vi.advanceTimersByTime(5000)
        })

        expect(
            screen.getByText('1 / 3'),
        ).toBeInTheDocument()
    })

    it('pauses automatic movement while hovered', () => {
        renderCarousel()

        const list = screen.getByRole(
            'list',
            {
                name: 'New additions books',
            },
        )

        fireEvent.mouseEnter(list)

        act(() => {
            vi.advanceTimersByTime(10000)
        })

        expect(
            screen.getByText('1 / 3'),
        ).toBeInTheDocument()

        fireEvent.mouseLeave(list)

        act(() => {
            vi.advanceTimersByTime(5000)
        })

        expect(
            screen.getByText('2 / 3'),
        ).toBeInTheDocument()
    })

    it('pauses automatic movement while focus is inside the carousel', () => {
        renderCarousel()

        const list = screen.getByRole(
            'list',
            {
                name: 'New additions books',
            },
        )

        fireEvent.focus(list)

        act(() => {
            vi.advanceTimersByTime(5000)
        })

        expect(
            screen.getByText('1 / 3'),
        ).toBeInTheDocument()

        fireEvent.blur(list)

        act(() => {
            vi.advanceTimersByTime(5000)
        })

        expect(
            screen.getByText('2 / 3'),
        ).toBeInTheDocument()
    })

    it('temporarily pauses after manual interaction', () => {
        renderCarousel()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Next New additions books',
            }),
        )

        expect(
            screen.getByText('2 / 3'),
        ).toBeInTheDocument()

        act(() => {
            vi.advanceTimersByTime(5000)
        })

        expect(
            screen.getByText('2 / 3'),
        ).toBeInTheDocument()

        act(() => {
            vi.advanceTimersByTime(3000)
        })

        act(() => {
            vi.advanceTimersByTime(5000)
        })

        expect(
            screen.getByText('3 / 3'),
        ).toBeInTheDocument()
    })

    it('resets the temporary pause when the user interacts again', () => {
        renderCarousel()

        const list = screen.getByRole(
            'list',
            {
                name: 'New additions books',
            },
        )

        fireEvent.pointerDown(list)

        act(() => {
            vi.advanceTimersByTime(4000)
        })

        fireEvent.pointerDown(list)

        act(() => {
            vi.advanceTimersByTime(4000)
        })

        expect(
            screen.getByText('1 / 3'),
        ).toBeInTheDocument()

        act(() => {
            vi.advanceTimersByTime(4000)
        })

        act(() => {
            vi.advanceTimersByTime(5000)
        })

        expect(
            screen.getByText('2 / 3'),
        ).toBeInTheDocument()
    })

    it('does not auto-advance when reduced motion is requested', () => {
        setReducedMotion(true)

        renderCarousel()

        act(() => {
            vi.advanceTimersByTime(15000)
        })

        expect(
            screen.getByText('1 / 3'),
        ).toBeInTheDocument()
    })

    it('does not start auto-advance for a single item', () => {
        render(
            <HomeBookCarousel ariaLabel="New additions books">
                <li>Only book</li>
            </HomeBookCarousel>,
        )

        act(() => {
            vi.advanceTimersByTime(15000)
        })

        expect(
            screen.getByText('1 / 1'),
        ).toBeInTheDocument()
    })

    it('cleans up interaction timers when unmounted', () => {
        const clearTimeout =
            vi.spyOn(
                window,
                'clearTimeout',
            )

        const {
            list,
            unmount,
        } = renderCarousel()

        fireEvent.pointerDown(list)

        unmount()

        expect(
            clearTimeout,
        ).toHaveBeenCalled()
    })
})