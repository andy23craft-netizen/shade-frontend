import { useEffect, useRef } from 'react'

import {
    IsbnScannerParser,
    type IsbnScannerParserOptions,
} from './isbnScannerParser'

export interface UseHardwareIsbnScannerOptions
    extends IsbnScannerParserOptions {
    enabled?: boolean
    onDetected: (isbn: string) => void
}

export function useHardwareIsbnScanner({
                                           enabled = true,
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
            const result = parser.handleKey(
                event.key,
                performance.now(),
            )

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
    }, [enabled, timeoutMs])
}