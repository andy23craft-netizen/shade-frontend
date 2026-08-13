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
    createIsbnDecodeHints,
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
