import { describe, expect, it } from 'vitest'

import {
    createBookLabelQrOptions,
    getBookLabelQrCenterImage,
} from './labelQrOptions'

describe('book label QR options', () => {
    it('uses the Shade favicon for Andy labels', () => {
        expect(getBookLabelQrCenterImage('andy')).toBe('/favicon-shade.png')
        expect(
            createBookLabelQrOptions('shade:v1:book:book-1', 'andy').image,
        ).toBe('/favicon-shade.png')
    })

    it.each([
        ['dalmo', '/favicon-dalmo.png'],
        ['jamie', '/favicon-jamie.png'],
    ] as const)('uses the tenant favicon for %s labels', (libraryId, image) => {
        expect(getBookLabelQrCenterImage(libraryId)).toBe(image)
    })

    it('uses each tenant palette while retaining a high-contrast finder', () => {
        const dalmo = createBookLabelQrOptions('shade:v1:book:book-1', 'dalmo')
        const jamie = createBookLabelQrOptions('shade:v1:book:book-1', 'jamie')

        expect(dalmo.dotsOptions?.gradient?.colorStops).toEqual([
            { offset: 0, color: '#65164e' },
            { offset: 1, color: '#003642' },
        ])
        expect(dalmo.cornersSquareOptions?.color).toBe('#002f39')
        expect(jamie.dotsOptions?.gradient?.colorStops).toEqual([
            { offset: 0, color: '#672006' },
            { offset: 1, color: '#e85d18' },
        ])
        expect(jamie.cornersSquareOptions?.color).toBe('#672006')
    })
})
