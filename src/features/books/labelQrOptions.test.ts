import { describe, expect, it } from 'vitest'
import { createBookLabelQrOptions, getBookLabelQrCenterImage } from './labelQrOptions'

describe('book label QR options', () => {
    it('uses neutral visual assets for an arbitrary host namespace', () => {
        expect(getBookLabelQrCenterImage('tenant-a.example.test')).toBe('/favicon-shade.png')
        const options = createBookLabelQrOptions('shade:v1:book:book-1', 'tenant-a.example.test')
        expect(options.image).toBe('/favicon-shade.png')
        expect(options.dotsOptions?.gradient?.colorStops).toEqual([
            { offset: 0, color: '#5b0000' },
            { offset: 1, color: '#006200' },
        ])
        expect(options.cornersSquareOptions?.color).toBe('#000000')
    })
})
