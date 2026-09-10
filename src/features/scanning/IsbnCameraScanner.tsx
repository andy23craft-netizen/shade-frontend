import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    BrowserMultiFormatReader,
} from '@zxing/browser'
import type {
    Result,
} from '@zxing/library'

import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import {
    buildCameraVideoConstraints,
    CAMERA_SCAN_TIMEOUT_MS,
    createAlbumBarcodeDecodeHints,
    createAlbumCatalogCodeDecodeHints,
    createIsbnDecodeHints,
    getCameraCapabilityError,
    isAcceptableCameraAlbumBarcode,
    isAcceptableCameraAlbumCode,
    isAcceptableCameraIsbn,
} from './isbnCameraCapture'

export interface IsbnScannerProps {
    onDetected: (isbn: string) => void
    onCancel: () => void
}

export function IsbnCameraScanner({
    onDetected,
    onCancel,
}: IsbnScannerProps) {
    return <CameraBarcodeScanner mode="isbn" onDetected={onDetected} onCancel={onCancel} />
}

export function AlbumBarcodeCameraScanner({
    onDetected,
    onCancel,
}: IsbnScannerProps) {
    return <CameraBarcodeScanner mode="album" onDetected={onDetected} onCancel={onCancel} />
}

export function AlbumCatalogCodeCameraScanner({
    onDetected,
    onCancel,
}: IsbnScannerProps) {
    return <CameraBarcodeScanner mode="album-code" onDetected={onDetected} onCancel={onCancel} />
}

function CameraBarcodeScanner({
    mode,
    onDetected,
    onCancel,
}: IsbnScannerProps & { mode: 'isbn' | 'album' | 'album-code' }) {
    const isAlbum = mode === 'album' || mode === 'album-code'
    const isAlbumCode = mode === 'album-code'
    const identifier = isAlbumCode ? 'album code or barcode' : isAlbum ? 'barcode' : 'ISBN'
    const capabilityError =
        getCameraCapabilityError(identifier)

    const videoRef =
        useRef<HTMLVideoElement>(null)

    const controlsRef =
        useRef<{
            stop: () => void
        } | null>(null)

    const mediaTracksRef =
        useRef<MediaStreamTrack[]>([])

    const hasDetectedRef =
        useRef(false)

    const scanTimeoutRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null)

    const [
        runtimeError,
        setRuntimeError,
    ] = useState<string | null>(null)

    const [
        scanTimedOut,
        setScanTimedOut,
    ] = useState(false)

    const [
        isStarting,
        setIsStarting,
    ] = useState(capabilityError === null)

    const [
        selectedDeviceId,
        setSelectedDeviceId,
    ] = useState<string | null>(null)

    const [
        videoDevices,
        setVideoDevices,
    ] = useState<MediaDeviceInfo[]>([])

    const error =
        capabilityError ?? runtimeError

    useEffect(() => {
        if (
            typeof window.matchMedia !== 'function' ||
            !window.matchMedia('(max-width: 40rem)').matches
        ) {
            return
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [])

    useEffect(() => {
        if (capabilityError) {
            return
        }

        const reader =
            new BrowserMultiFormatReader(
                isAlbumCode ? createAlbumCatalogCodeDecodeHints() : isAlbum ? createAlbumBarcodeDecodeHints() : createIsbnDecodeHints(),
            )

        let cancelled = false

        function clearScanTimeout(): void {
            if (scanTimeoutRef.current !== null) {
                clearTimeout(
                    scanTimeoutRef.current,
                )
                scanTimeoutRef.current = null
            }
        }

        function stopScanner(): void {
            clearScanTimeout()

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

        function handleMediaTrackEnded(): void {
            stopScanner()
        }

        function startScanTimeout(): void {
            clearScanTimeout()
            setScanTimedOut(false)

            scanTimeoutRef.current = setTimeout(
                () => {
                    if (
                        cancelled ||
                        hasDetectedRef.current
                    ) {
                        return
                    }

                    setScanTimedOut(true)
                },
                CAMERA_SCAN_TIMEOUT_MS,
            )
        }

        async function refreshVideoDevices(): Promise<void> {
            try {
                const devices =
                    await BrowserMultiFormatReader.listVideoInputDevices()

                if (!cancelled) {
                    setVideoDevices(devices)
                }
            } catch {
                if (!cancelled) {
                    setVideoDevices([])
                }
            }
        }

        async function startScanner() {
            if (!videoRef.current) {
                return
            }

            setIsStarting(true)
            setRuntimeError(null)
            setScanTimedOut(false)

            try {
                const controls =
                    await reader.decodeFromConstraints(
                        {
                            video: buildCameraVideoConstraints(
                                selectedDeviceId,
                            ),
                            audio: false,
                        },
                        videoRef.current,
                        (result?: Result) => {
                            if (
                                cancelled ||
                                hasDetectedRef.current ||
                                !result
                            ) {
                                return
                            }

                            const value = result
                                .getText()
                                .trim()

                            if (
                                !(isAlbumCode
                                    ? isAcceptableCameraAlbumCode(value, result.getBarcodeFormat())
                                    : isAlbum
                                    ? isAcceptableCameraAlbumBarcode(value, result.getBarcodeFormat())
                                    : isAcceptableCameraIsbn(value, result.getBarcodeFormat()))
                            ) {
                                return
                            }

                            hasDetectedRef.current =
                                true
                            clearScanTimeout()
                            controlsRef.current?.stop()
                            controlsRef.current =
                                null
                            onDetected(value)
                        },
                    )

                if (cancelled) {
                    controls.stop()
                    return
                }

                controlsRef.current = controls

                const stream =
                    videoRef.current?.srcObject

                if (
                    stream &&
                    typeof stream === 'object' &&
                    'getTracks' in stream &&
                    typeof stream.getTracks ===
                        'function'
                ) {
                    const tracks =
                        stream.getTracks()

                    mediaTracksRef.current =
                        tracks

                    for (const track of tracks) {
                        track.addEventListener(
                            'ended',
                            handleMediaTrackEnded,
                        )
                    }
                }

                setIsStarting(false)
                startScanTimeout()
                await refreshVideoDevices()
            } catch (scannerError) {
                setIsStarting(false)

                if (cancelled) {
                    return
                }

                if (
                    scannerError instanceof
                    DOMException
                ) {
                    if (
                        scannerError.name ===
                        'NotAllowedError'
                    ) {
                        setRuntimeError(
                            `Camera access was denied. Allow camera access and try again, or enter the ${identifier} manually.`,
                        )
                        return
                    }

                    if (
                        scannerError.name ===
                        'NotFoundError'
                    ) {
                        setRuntimeError(
                            `No camera was found on this device. You can enter the ${identifier} manually instead.`,
                        )
                        return
                    }
                }

                setRuntimeError(
                    `The camera could not be started. You can enter the ${identifier} manually instead.`,
                )
            }
        }

        void startScanner()

        return () => {
            cancelled = true
            stopScanner()
        }
    }, [
        capabilityError,
        identifier,
        isAlbum,
        isAlbumCode,
        onDetected,
        selectedDeviceId,
    ])

    function handleContinueScanning(): void {
        setScanTimedOut(false)

        if (scanTimeoutRef.current !== null) {
            clearTimeout(scanTimeoutRef.current)
        }

        scanTimeoutRef.current = setTimeout(
            () => {
                if (hasDetectedRef.current) {
                    return
                }

                setScanTimedOut(true)
            },
            CAMERA_SCAN_TIMEOUT_MS,
        )
    }

    return (
        <section
            aria-labelledby={`${mode}-scanner-heading`}
            className="isbn-camera-scanner"
        >
            <header>
                <h2 id={`${mode}-scanner-heading`}>
                    {isAlbum ? 'Scan barcode' : 'Scan ISBN'}
                </h2>
            </header>

            {error ? (
                <Alert variant="error">
                    {error}
                </Alert>
            ) : null}

            {!error ? (
                <>
                    <div className="isbn-camera-scanner__viewfinder">
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            aria-label={isAlbum ? 'Album barcode camera' : 'ISBN camera'}
                        />
                    </div>

                    {isStarting ? (
                        <p role="status">
                            Starting camera…
                        </p>
                    ) : (
                        <p>
                            {isAlbumCode
                                ? 'Point the camera at a Shade label or the barcode on the album.'
                                : isAlbum
                                ? 'Point the camera at the barcode on the album.'
                                : 'Point the camera at the ISBN barcode on the back of the book.'}
                        </p>
                    )}

                    {scanTimedOut ? (
                        <Alert
                            variant="warning"
                            title={isAlbumCode ? 'No album code found' : isAlbum ? 'No album barcode found' : 'No ISBN barcode found'}
                        >
                            No readable {isAlbumCode ? 'album code or barcode' : isAlbum ? 'album' : 'ISBN'} barcode
                            was detected. Improve
                            lighting, move closer, or
                            enter the {identifier} manually.
                            <div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={
                                        handleContinueScanning
                                    }
                                >
                                    Keep scanning
                                </Button>
                            </div>
                        </Alert>
                    ) : null}

                    {videoDevices.length > 1 ? (
                        <Field
                            label="Camera"
                            helpText={`Switch cameras if the ${identifier} is hard to read`}
                        >
                            <select
                                name="isbnCameraDevice"
                                value={
                                    selectedDeviceId ??
                                    ''
                                }
                                onChange={(
                                    event,
                                ) => {
                                    const nextDeviceId =
                                        event.target
                                            .value

                                    setSelectedDeviceId(
                                        nextDeviceId ||
                                            null,
                                    )
                                }}
                                disabled={
                                    isStarting
                                }
                            >
                                <option value="">
                                    Default camera
                                </option>
                                {videoDevices.map(
                                    (
                                        device,
                                        index,
                                    ) => (
                                        <option
                                            key={
                                                device.deviceId
                                            }
                                            value={
                                                device.deviceId
                                            }
                                        >
                                            {device.label ||
                                                `Camera ${index + 1}`}
                                        </option>
                                    ),
                                )}
                            </select>
                        </Field>
                    ) : null}
                </>
            ) : null}

            <div className="isbn-camera-scanner__actions">
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
