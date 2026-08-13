import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    BrowserMultiFormatReader,
} from '@zxing/browser'

import { Button } from '../../components/Button'
export interface IsbnScannerProps {
    onDetected: (isbn: string) => void
    onCancel: () => void
}

export function IsbnCameraScanner({
                                onDetected,
                                onCancel,
                            }: IsbnScannerProps) {
    const videoRef =
        useRef<HTMLVideoElement>(null)

    const controlsRef =
        useRef<{
            stop: () => void
        } | null>(null)

    const mediaTracksRef =
        useRef<MediaStreamTrack[]>([])

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

        function handleMediaTrackEnded(): void {
            for (const track of mediaTracksRef.current) {
                track.removeEventListener(
                    'ended',
                    handleMediaTrackEnded,
                )
            }

            mediaTracksRef.current = []

            controlsRef.current?.stop()
            controlsRef.current = null
        }

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
                            controlsRef.current?.stop()
                            controlsRef.current = null
                            onDetected(isbn)
                        },
                    )
                controlsRef.current = controls

                const stream =
                    videoRef.current?.srcObject

                if (
                    stream &&
                    typeof stream === 'object' &&
                    'getTracks' in stream &&
                    typeof stream.getTracks === 'function'
                ) {
                    const tracks = stream.getTracks()

                    mediaTracksRef.current = tracks

                    for (const track of tracks) {
                        track.addEventListener(
                            'ended',
                            handleMediaTrackEnded,
                        )
                    }
                }

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
            handleMediaTrackEnded()
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
