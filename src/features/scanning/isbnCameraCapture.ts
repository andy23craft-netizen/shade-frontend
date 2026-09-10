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

const ALBUM_BARCODE_FORMATS = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
] as const

const ALBUM_CATALOG_CODE_FORMATS = [
    ...ALBUM_BARCODE_FORMATS,
    BarcodeFormat.QR_CODE,
] as const

export function createAlbumBarcodeDecodeHints(): Map<
    DecodeHintType,
    BarcodeFormat[]
> {
    const hints = new Map<DecodeHintType, BarcodeFormat[]>()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [...ALBUM_BARCODE_FORMATS])
    return hints
}

export function createAlbumCatalogCodeDecodeHints(): Map<
    DecodeHintType,
    BarcodeFormat[]
> {
    const hints = new Map<DecodeHintType, BarcodeFormat[]>()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [...ALBUM_CATALOG_CODE_FORMATS])
    return hints
}

/**
 * QR contents are deliberately not parsed locally. The catalog resolver owns
 * validation and tenant-safe lookup of Shade labels.
 */
export function isAcceptableCameraAlbumCode(
    text: string,
    barcodeFormat?: BarcodeFormat,
): boolean {
    if (barcodeFormat === BarcodeFormat.QR_CODE) return text.trim() !== ''
    return isAcceptableCameraAlbumBarcode(text, barcodeFormat)
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

export function getCameraCapabilityError(identifier = 'ISBN'): string | null {
    if (!isSecureCameraContext()) {
        return `Camera scanning needs a secure connection (HTTPS or localhost). You can enter the ${identifier} manually instead.`
    }

    if (!isCameraCaptureSupported()) {
        return `This browser does not support camera scanning. You can enter the ${identifier} manually instead.`
    }

    return null
}

export function isAcceptableCameraAlbumBarcode(
    text: string,
    barcodeFormat?: BarcodeFormat,
): boolean {
    const normalized = text.trim().replace(/[\s-]/g, '')

    if (!/^\d+$/.test(normalized)) return false

    if (barcodeFormat === undefined) {
        return normalized.length >= 6 && normalized.length <= 13
    }

    if (!ALBUM_BARCODE_FORMATS.includes(barcodeFormat as typeof ALBUM_BARCODE_FORMATS[number])) {
        return false
    }

    const expectedLengths: Partial<Record<BarcodeFormat, number[]>> = {
        [BarcodeFormat.EAN_13]: [13],
        [BarcodeFormat.EAN_8]: [8],
        [BarcodeFormat.UPC_A]: [12],
        [BarcodeFormat.UPC_E]: [6, 7, 8],
    }

    return expectedLengths[barcodeFormat]?.includes(normalized.length) ?? false
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
