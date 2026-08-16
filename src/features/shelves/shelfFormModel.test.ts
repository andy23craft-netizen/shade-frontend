import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    ShelfRead,
} from '../../api/apiTypes'
import {
    emptyShelfFormValues,
    formValuesToShelfCreate,
    formValuesToShelfUpdate,
    shelfFormValuesFromShelf,
    shelfUpdateHasChanges,
    validateShelfFormValues,
} from './shelfFormModel'

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

describe('shelfFormModel', () => {
    it('validates blank and reserved create names', () => {
        expect(
            validateShelfFormValues({
                ...emptyShelfFormValues,
                common_name: '  ',
            }),
        ).toEqual({
            common_name: 'Enter a shelf name.',
        })

        expect(
            validateShelfFormValues({
                ...emptyShelfFormValues,
                common_name: 'unknown',
            }),
        ).toEqual({
            common_name:
                'Reserved system shelf names cannot be used.',
        })
    })

    it('skips name validation when rename is forbidden', () => {
        expect(
            validateShelfFormValues(
                {
                    ...emptyShelfFormValues,
                    common_name: 'unknown',
                },
                {
                    allowRename: false,
                },
            ),
        ).toEqual({})
    })

    it('builds create payloads with normalized names', () => {
        expect(
            formValuesToShelfCreate({
                common_name: '  Liz_TBR ',
                location: ' Office ',
                description: '  ',
            }),
        ).toEqual({
            common_name: 'liz_tbr',
            location: 'Office',
        })
    })

    it('rejects reserved create names', () => {
        expect(() =>
            formValuesToShelfCreate({
                ...emptyShelfFormValues,
                common_name: 'Removed',
            }),
        ).toThrow(
            'Reserved system shelf names cannot be used.',
        )
    })

    it('builds minimal update patches and clears blanks to null', () => {
        const shelf = makeShelf({
            shelf_id: 'shelf-1',
            common_name: 'a1',
            location: 'Living room',
            description: 'Old notes',
        })

        const values = shelfFormValuesFromShelf(
            shelf,
        )

        expect(
            formValuesToShelfUpdate(
                {
                    ...values,
                    common_name: 'B2',
                    location: '',
                    description: 'New notes',
                },
                shelf,
            ),
        ).toEqual({
            common_name: 'b2',
            location: null,
            description: 'New notes',
        })
    })

    it('omits unchanged fields and reports empty patches', () => {
        const shelf = makeShelf({
            shelf_id: 'shelf-1',
            common_name: 'a1',
            location: 'Office',
        })

        const patch = formValuesToShelfUpdate(
            shelfFormValuesFromShelf(shelf),
            shelf,
        )

        expect(patch).toEqual({})
        expect(
            shelfUpdateHasChanges(patch),
        ).toBe(false)
    })

    it('does not rename when allowRename is false', () => {
        const shelf = makeShelf({
            shelf_id: 'shelf-unknown',
            common_name: 'unknown',
            location: null,
        })

        expect(
            formValuesToShelfUpdate(
                {
                    common_name: 'renamed',
                    location: 'Basement',
                    description: '',
                },
                shelf,
                {
                    allowRename: false,
                },
            ),
        ).toEqual({
            location: 'Basement',
        })
    })
})
