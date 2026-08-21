import {
    describe,
    expect,
    it,
} from 'vitest'
import {
    isGuid,
} from './guid'

describe('isGuid', () => {
    it('accepts canonical dashed UUID strings', () => {
        expect(
            isGuid(
                '550e8400-e29b-41d4-a716-446655440000',
            ),
        ).toBe(true)

        expect(
            isGuid(
                '550E8400-E29B-41D4-A716-446655440000',
            ),
        ).toBe(true)
    })

    it('trims surrounding whitespace', () => {
        expect(
            isGuid(
                '  550e8400-e29b-41d4-a716-446655440000  ',
            ),
        ).toBe(true)
    })

    it('rejects legacy spreadsheet book codes and other non-GUIDs', () => {
        expect(isGuid('SL-0001')).toBe(false)
        expect(isGuid('book-1')).toBe(false)
        expect(isGuid('')).toBe(false)
        expect(
            isGuid(
                '550e8400e29b41d4a716446655440000',
            ),
        ).toBe(false)
        expect(
            isGuid(
                '550e8400-e29b-41d4-a716-44665544000',
            ),
        ).toBe(false)
    })
})
