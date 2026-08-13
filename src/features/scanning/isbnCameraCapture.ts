import {
    BarcodeFormat,
} from '@zxing/browser'
import {
    DecodeHintType,
} from '@zxing/library'

import {
    isValidIsbn,
} from '../books/utils/isbn'

/** How long to wait for a readable ISBN barcode before showing guidance. */
export const CAMERA_SCAN_TIMEOUT_MS = 30_000

const BOOKLAND_PREFIXES = [
    '978',
    '979',
] as const

export function createIsbnDecodeHints(): Map<
    DecodeHintType,
    BarcodeFormat[]
> {
    const hints = new Map<
        DecodeHintType,
        BarcodeFormat[]
    >()

    hints.set(
        DecodeHintType.POSSIBLE_FORMATS,
        [BarcodeFormat.EAN_13],
    )

    return hints
}

export function isSecureCameraContext(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.isSecureContext
    )
}

export function isCameraCaptureSupported(): boolean {
    return Boolean(
        typeof navigator !== 'undefined' &&
            navigator.mediaDevices &&
            typeof navigator.mediaDevices
                .getUserMedia === 'function',
    )
}

export function getCameraCapabilityError(): string | null {
    if (!isSecureCameraContext()) {
        return 'Camera scanning needs a secure connection (HTTPS or localhost). You can enter the ISBN manually instead.'
    }

    if (!isCameraCaptureSupported()) {
        return 'This browser does not support camera scanning. You can enter the ISBN manually instead.'
    }

    return null
}

/**
 * Accept only ISBN barcode payloads from the camera path.
 * Physical ISBN barcodes decode as EAN-13 Bookland values (978/979).
 */
export function isAcceptableCameraIsbn(
    text: string,
    barcodeFormat?: BarcodeFormat,
): boolean {
    if (
        barcodeFormat !== undefined &&
        barcodeFormat !== BarcodeFormat.EAN_13
    ) {
        return false
    }

    const trimmed = text.trim()

    if (!trimmed || !isValidIsbn(trimmed)) {
        return false
    }

    const normalized = trimmed
        .replace(/[\s-]/g, '')
        .toUpperCase()

    if (normalized.length === 13) {
        return BOOKLAND_PREFIXES.some(
            (prefix) =>
                normalized.startsWith(prefix),
        )
    }

    return normalized.length === 10
}

export function buildCameraVideoConstraints(
    deviceId: string | null,
): MediaTrackConstraints {
    if (deviceId) {
        return {
            deviceId: {
                exact: deviceId,
            },
        }
    }

    return {
        facingMode: {
            ideal: 'environment',
        },
    }
}
