import {
    fireEvent,
    renderHook,
} from '@testing-library/react'
import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    useHardwareIsbnScanner,
} from './useHardwareIsbnScanner'

describe('useHardwareIsbnScanner', () => {
    it('emits a valid scanned ISBN', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                onDetected,
            }),
        )

        for (const key of '9780441172719') {
            fireEvent.keyDown(window, { key })
        }

        fireEvent.keyDown(window, {
            key: 'Enter',
        })

        expect(onDetected).toHaveBeenCalledOnce()
        expect(onDetected).toHaveBeenCalledWith(
            '9780441172719',
        )
    })

    it('can capture a scanner while an input is focused', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                onDetected,
            }),
        )

        const input =
            document.createElement('input')

        document.body.appendChild(input)
        input.focus()

        for (const key of '9780441172719') {
            fireEvent.keyDown(input, { key })
        }

        fireEvent.keyDown(input, {
            key: 'Enter',
        })

        expect(onDetected).toHaveBeenCalledOnce()
        expect(onDetected).toHaveBeenCalledWith(
            '9780441172719',
        )

        input.remove()
    })

    it('does not prevent normal keyboard events', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                onDetected,
            }),
        )

        const input =
            document.createElement('input')

        document.body.appendChild(input)
        input.focus()

        const event = new KeyboardEvent(
            'keydown',
            {
                key: 'a',
                bubbles: true,
                cancelable: true,
            },
        )

        input.dispatchEvent(event)

        expect(event.defaultPrevented).toBe(false)
        expect(onDetected).not.toHaveBeenCalled()

        input.remove()
    })

    it('does not emit an invalid ISBN', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                onDetected,
            }),
        )

        for (const key of '9780441172710') {
            fireEvent.keyDown(window, { key })
        }

        fireEvent.keyDown(window, {
            key: 'Enter',
        })

        expect(onDetected).not.toHaveBeenCalled()
    })

    it('can be disabled', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                enabled: false,
                onDetected,
            }),
        )

        for (const key of '9780441172719') {
            fireEvent.keyDown(window, { key })
        }

        fireEvent.keyDown(window, {
            key: 'Enter',
        })

        expect(onDetected).not.toHaveBeenCalled()
    })

    it('stops listening when unmounted', () => {
        const onDetected = vi.fn()

        const { unmount } = renderHook(() =>
            useHardwareIsbnScanner({
                onDetected,
            }),
        )

        unmount()

        for (const key of '9780441172719') {
            fireEvent.keyDown(window, { key })
        }

        fireEvent.keyDown(window, {
            key: 'Enter',
        })

        expect(onDetected).not.toHaveBeenCalled()
    })

    it('ignores focused inputs when configured', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                ignoreEditableTargets: true,
                onDetected,
            }),
        )

        const input =
            document.createElement('input')

        document.body.appendChild(input)
        input.focus()

        for (const key of '9780441172719') {
            fireEvent.keyDown(input, { key })
        }

        fireEvent.keyDown(input, {
            key: 'Enter',
        })

        expect(onDetected).not.toHaveBeenCalled()

        input.remove()
    })

    it('ignores focused selects when configured', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                ignoreEditableTargets: true,
                onDetected,
            }),
        )

        const select =
            document.createElement('select')

        document.body.appendChild(select)
        select.focus()

        for (const key of '9780441172719') {
            fireEvent.keyDown(select, { key })
        }

        fireEvent.keyDown(select, {
            key: 'Enter',
        })

        expect(onDetected).not.toHaveBeenCalled()

        select.remove()
    })

    it('ignores modifier chords when configured', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                ignoreEditableTargets: true,
                onDetected,
            }),
        )

        fireEvent.keyDown(window, {
            key: '9',
            ctrlKey: true,
        })

        for (const key of '9780441172719') {
            fireEvent.keyDown(window, { key })
        }

        fireEvent.keyDown(window, {
            key: 'Enter',
        })

        expect(onDetected).toHaveBeenCalledOnce()
        expect(onDetected).toHaveBeenCalledWith(
            '9780441172719',
        )
    })

    it('prevents default for consumed scan keys when configured', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                preventDefaultWhenConsumed: true,
                onDetected,
            }),
        )

        for (const key of '9780441172719') {
            const event = new KeyboardEvent(
                'keydown',
                {
                    key,
                    bubbles: true,
                    cancelable: true,
                },
            )

            window.dispatchEvent(event)

            expect(event.defaultPrevented).toBe(true)
        }

        const enterEvent = new KeyboardEvent(
            'keydown',
            {
                key: 'Enter',
                bubbles: true,
                cancelable: true,
            },
        )

        window.dispatchEvent(enterEvent)

        expect(enterEvent.defaultPrevented).toBe(true)
        expect(onDetected).toHaveBeenCalledWith(
            '9780441172719',
        )
    })

    it('does not prevent default for unconsumed keys', () => {
        const onDetected = vi.fn()

        renderHook(() =>
            useHardwareIsbnScanner({
                preventDefaultWhenConsumed: true,
                onDetected,
            }),
        )

        const event = new KeyboardEvent(
            'keydown',
            {
                key: 'a',
                bubbles: true,
                cancelable: true,
            },
        )

        window.dispatchEvent(event)

        expect(event.defaultPrevented).toBe(false)
        expect(onDetected).not.toHaveBeenCalled()
    })
})