import { useEffect, useRef } from 'react'

import {
    IsbnScannerParser,
    type IsbnScannerParserOptions,
} from './isbnScannerParser'

export interface UseHardwareIsbnScannerOptions
    extends IsbnScannerParserOptions {
    enabled?: boolean
    ignoreEditableTargets?: boolean
    preventDefaultWhenConsumed?: boolean
    onDetected: (isbn: string) => void
}

function isEditableKeyTarget(
    target: EventTarget | null,
): boolean {
    if (!(target instanceof HTMLElement)) {
        return false
    }

    return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
    )
}

export function useHardwareIsbnScanner({
                                           enabled = true,
                                           ignoreEditableTargets = false,
                                           preventDefaultWhenConsumed = false,
                                           onDetected,
                                           timeoutMs,
                                       }: UseHardwareIsbnScannerOptions): void {
    const onDetectedRef = useRef(onDetected)

    useEffect(() => {
        onDetectedRef.current = onDetected
    }, [onDetected])

    useEffect(() => {
        if (!enabled) {
            return
        }

        const parser = new IsbnScannerParser({
            timeoutMs,
        })

        const handleKeyDown = (
            event: KeyboardEvent,
        ): void => {
            if (
                ignoreEditableTargets &&
                (
                    event.ctrlKey ||
                    event.metaKey ||
                    event.altKey ||
                    isEditableKeyTarget(event.target)
                )
            ) {
                return
            }

            const result = parser.handleKey(
                event.key,
                performance.now(),
            )

            if (
                preventDefaultWhenConsumed &&
                result.consumed
            ) {
                event.preventDefault()
            }

            if (result.isbn !== null) {
                onDetectedRef.current(result.isbn)
            }
        }

        window.addEventListener(
            'keydown',
            handleKeyDown,
        )

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown,
            )

            parser.cancel()
        }
    }, [
        enabled,
        ignoreEditableTargets,
        preventDefaultWhenConsumed,
        timeoutMs,
    ])
}
