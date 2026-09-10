import {
    BarcodeFormat,
} from '@zxing/browser'
import {
    DecodeHintType,
} from '@zxing/library'
import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    buildCameraVideoConstraints,
    createAlbumBarcodeDecodeHints,
    createAlbumCatalogCodeDecodeHints,
    createIsbnDecodeHints,
    isAcceptableCameraAlbumBarcode,
    isAcceptableCameraAlbumCode,
    isAcceptableCameraIsbn,
} from './isbnCameraCapture'

describe('createIsbnDecodeHints', () => {
    it('restricts decoding to EAN-13 only', () => {
        const hints = createIsbnDecodeHints()

        expect(
            hints.get(
                DecodeHintType.POSSIBLE_FORMATS,
            ),
        ).toEqual([BarcodeFormat.EAN_13])
    })
})

describe('album barcode camera capture', () => {
    it('enables the retail barcode formats used by albums', () => {
        expect(createAlbumBarcodeDecodeHints().get(DecodeHintType.POSSIBLE_FORMATS)).toEqual([
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
        ])
    })

    it.each([
        ['602547888330', BarcodeFormat.UPC_A],
        ['4006381333931', BarcodeFormat.EAN_13],
        ['96385074', BarcodeFormat.EAN_8],
        ['123456', BarcodeFormat.UPC_E],
    ])('accepts %s from its matching symbology', (value, format) => {
        expect(isAcceptableCameraAlbumBarcode(value, format)).toBe(true)
    })

    it('rejects unsupported formats and non-numeric payloads', () => {
        expect(isAcceptableCameraAlbumBarcode('602547888330', BarcodeFormat.QR_CODE)).toBe(false)
        expect(isAcceptableCameraAlbumBarcode('not-a-barcode', BarcodeFormat.UPC_A)).toBe(false)
    })
})

describe('album catalog-code camera capture', () => {
    it('accepts both retail album barcodes and opaque QR payloads', () => {
        expect(createAlbumCatalogCodeDecodeHints().get(DecodeHintType.POSSIBLE_FORMATS)).toContain(BarcodeFormat.QR_CODE)
        expect(isAcceptableCameraAlbumCode('602547888330', BarcodeFormat.UPC_A)).toBe(true)
        expect(isAcceptableCameraAlbumCode('shade:v1:album:opaque-id', BarcodeFormat.QR_CODE)).toBe(true)
    })

    it('does not interpret QR contents locally', () => {
        expect(isAcceptableCameraAlbumCode('not a Shade label', BarcodeFormat.QR_CODE)).toBe(true)
        expect(isAcceptableCameraAlbumCode('   ', BarcodeFormat.QR_CODE)).toBe(false)
    })
})

describe('isAcceptableCameraIsbn', () => {
    it('accepts a Bookland ISBN-13 EAN', () => {
        expect(
            isAcceptableCameraIsbn(
                '9780441172719',
                BarcodeFormat.EAN_13,
            ),
        ).toBe(true)
    })

    it('accepts a 979 Bookland ISBN-13', () => {
        expect(
            isAcceptableCameraIsbn(
                '9791234567896',
                BarcodeFormat.EAN_13,
            ),
        ).toBe(true)
    })

    it('rejects UPC symbology even with ISBN-like text', () => {
        expect(
            isAcceptableCameraIsbn(
                '9780441172719',
                BarcodeFormat.UPC_A,
            ),
        ).toBe(false)
    })

    it('rejects a non-Bookland EAN-13', () => {
        expect(
            isAcceptableCameraIsbn(
                '4006381333931',
                BarcodeFormat.EAN_13,
            ),
        ).toBe(false)
    })

    it('rejects an invalid ISBN checksum', () => {
        expect(
            isAcceptableCameraIsbn(
                '9780441172710',
                BarcodeFormat.EAN_13,
            ),
        ).toBe(false)
    })

    it('rejects blank text', () => {
        expect(
            isAcceptableCameraIsbn(
                '   ',
                BarcodeFormat.EAN_13,
            ),
        ).toBe(false)
    })
})

describe('buildCameraVideoConstraints', () => {
    it('prefers the rear camera when no device is selected', () => {
        expect(
            buildCameraVideoConstraints(null),
        ).toEqual({
            facingMode: {
                ideal: 'environment',
            },
        })
    })

    it('targets an exact device id when switching cameras', () => {
        expect(
            buildCameraVideoConstraints(
                'camera-2',
            ),
        ).toEqual({
            deviceId: {
                exact: 'camera-2',
            },
        })
    })
})
