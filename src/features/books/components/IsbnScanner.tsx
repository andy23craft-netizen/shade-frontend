import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    BrowserMultiFormatReader,
} from '@zxing/browser'

import { Button } from '../../../components/Button'
export interface IsbnScannerProps {
    onDetected: (isbn: string) => void
    onCancel: () => void
}

export function IsbnScanner({
                                onDetected,
                                onCancel,
                            }: IsbnScannerProps) {
    const videoRef =
        useRef<HTMLVideoElement>(null)

    const controlsRef =
        useRef<{
            stop: () => void
        } | null>(null)

    const [
        error,
        setError,
    ] = useState<string | null>(null)

    const [
        isStarting,
        setIsStarting,
    ] = useState(true)

    const hasDetectedRef =
        useRef(false)

    useEffect(() => {
        const reader =
            new BrowserMultiFormatReader()

        let cancelled = false

        async function startScanner() {
            if (!videoRef.current) {
                return
            }

            setIsStarting(true)
            setError(null)

            try {
                const controls =
                    await reader.decodeFromConstraints(
                        {
                            video: {
                                facingMode: {
                                    ideal: 'environment',
                                },
                            },
                            audio: false,
                        },
                        videoRef.current,
                        (result) => {
                            if (
                                cancelled ||
                                hasDetectedRef.current ||
                                !result
                            ) {
                                return
                            }

                            const isbn = result
                                .getText()
                                .trim()

                            if (!isbn) {
                                return
                            }

                            hasDetectedRef.current = true
                            onDetected(isbn)
                        },
                    )
                controlsRef.current = controls
                if (cancelled) {
                    return
                }
            } catch (scannerError) {


                setIsStarting(false)

                if (
                    scannerError instanceof
                    DOMException
                ) {
                    if (
                        scannerError.name ===
                        'NotAllowedError'
                    ) {
                        setError(
                            'Camera access was denied. Allow camera access and try again.',
                        )
                        return
                    }

                    if (
                        scannerError.name ===
                        'NotFoundError'
                    ) {
                        setError(
                            'No camera was found on this device.',
                        )
                        return
                    }
                }

                setError(
                    'The camera could not be started. You can enter the ISBN manually instead.',
                )
            }
        }

        void startScanner()

        return () => {
            cancelled = true
            controlsRef.current?.stop()
            controlsRef.current = null
        }
    }, [onDetected])

    return (
        <section
            aria-labelledby="isbn-scanner-heading"
        >
            <header>
                <h2 id="isbn-scanner-heading">
                    Scan ISBN
                </h2>
            </header>

            {error ? (
                <div
                    role="alert"
                    className="alert alert--error"
                >
                    {error}
                </div>
            ) : null}

            {!error ? (
                <>
                    <div>
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            aria-label="ISBN camera"
                        />
                    </div>

                    {isStarting ? (
                        <p>
                            Starting camera…
                        </p>
                    ) : (
                        <p>
                            Point the camera at the
                            ISBN barcode on the back
                            of the book.
                        </p>
                    )}
                </>
            ) : null}

            <div>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            </div>
        </section>
    )
}
