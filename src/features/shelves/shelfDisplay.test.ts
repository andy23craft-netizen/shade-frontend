import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    ShelfRead,
} from '../../api/apiTypes'
import {
    canDeleteShelf,
    canRenameShelf,
    filterAssignableShelves,
    formatShelfCommonNameForDisplay,
    isAssignableShelf,
    isSystemShelfCommonName,
    shelfCommonNameById,
    shelfIdByCommonName,
} from './shelfDisplay'

function makeShelf(
    overrides: Partial<ShelfRead> &
        Pick<ShelfRead, 'shelf_id' | 'common_name'>,
): ShelfRead {
    return {
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
        ...overrides,
    }
}

describe('formatShelfCommonNameForDisplay', () => {
    it('Title Cases lowercase API names and replaces underscores', () => {
        expect(
            formatShelfCommonNameForDisplay(
                'unknown',
            ),
        ).toBe('Unknown')

        expect(
            formatShelfCommonNameForDisplay(
                'removed',
            ),
        ).toBe('Removed')

        expect(
            formatShelfCommonNameForDisplay(
                'liz_tbr',
            ),
        ).toBe('Liz Tbr')

        expect(
            formatShelfCommonNameForDisplay('a1'),
        ).toBe('A1')
    })

    it('collapses whitespace after underscore replacement', () => {
        expect(
            formatShelfCommonNameForDisplay(
                '  liz__tbr  ',
            ),
        ).toBe('Liz Tbr')
    })
})

describe('assignable shelf rules', () => {
    it('keeps unknown assignable and excludes removed', () => {
        const shelves = [
            makeShelf({
                shelf_id: 'id-unknown',
                common_name: 'unknown',
            }),
            makeShelf({
                shelf_id: 'id-a1',
                common_name: 'a1',
            }),
            makeShelf({
                shelf_id: 'id-removed',
                common_name: 'removed',
            }),
        ]

        expect(
            isAssignableShelf(shelves[0]!),
        ).toBe(true)
        expect(
            isAssignableShelf(shelves[2]!),
        ).toBe(false)

        expect(
            filterAssignableShelves(shelves).map(
                (shelf) => shelf.common_name,
            ),
        ).toEqual([
            'unknown',
            'a1',
        ])
    })

    it('recognizes system shelf common names', () => {
        expect(
            isSystemShelfCommonName('unknown'),
        ).toBe(true)
        expect(
            isSystemShelfCommonName('REMOVED'),
        ).toBe(true)
        expect(
            isSystemShelfCommonName('a1'),
        ).toBe(false)
    })

    it('forbids rename and delete for system shelves only', () => {
        const unknown = makeShelf({
            shelf_id: 'id-unknown',
            common_name: 'unknown',
        })
        const custom = makeShelf({
            shelf_id: 'id-a1',
            common_name: 'a1',
        })

        expect(canRenameShelf(unknown)).toBe(false)
        expect(canDeleteShelf(unknown)).toBe(false)
        expect(canRenameShelf(custom)).toBe(true)
        expect(canDeleteShelf(custom)).toBe(true)
    })
})

describe('shelf id and name lookup', () => {
    const shelves = [
        makeShelf({
            shelf_id: 'id-a1',
            common_name: 'a1',
        }),
        makeShelf({
            shelf_id: 'id-unknown',
            common_name: 'unknown',
        }),
    ]

    it('resolves common_name from shelf_id', () => {
        expect(
            shelfCommonNameById(
                shelves,
                'id-a1',
            ),
        ).toBe('a1')

        expect(
            shelfCommonNameById(shelves, ''),
        ).toBeUndefined()
    })

    it('resolves shelf_id from common_name', () => {
        expect(
            shelfIdByCommonName(
                shelves,
                'Unknown',
            ),
        ).toBe('id-unknown')

        expect(
            shelfIdByCommonName(
                shelves,
                'missing',
            ),
        ).toBeUndefined()
    })
})
