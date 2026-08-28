import {
    describe,
    expect,
    it,
} from 'vitest'

import type {
    BulkBookLookupItemResult,
} from '../../api/apiTypes'
import {
    bulkAddLookupDetail,
    bulkAddStatusLabel,
    classifyBulkLookupResult,
    normalizeBulkAddIsbn,
} from './bulkAddModel'

function result(
    overrides: Partial<BulkBookLookupItemResult> = {},
): BulkBookLookupItemResult {
    return {
        client_item_id: 'scan-1',
        status: 'found',
        catalog_state: 'new',
        draft: {
            title: 'Test Book',
            authors: 'Test Author',
            isbn13: '9780140449266',
        },
        missing_fields: [],
        ...overrides,
    }
}

describe('bulkAddModel', () => {
    it('normalizes formatted ISBN input for duplicate detection', () => {
        expect(
            normalizeBulkAddIsbn(' 978-0-14-044926-6 '),
        ).toBe('9780140449266')
    })

    it('classifies a complete new lookup as ready', () => {
        expect(
            classifyBulkLookupResult(result()),
        ).toBe('ready')
    })

    it('classifies incomplete metadata as needs review', () => {
        expect(
            classifyBulkLookupResult(
                result({
                    missing_fields: ['authors'],
                }),
            ),
        ).toBe('needs_review')
    })

    it('classifies wishlist matches as needs review', () => {
        expect(
            classifyBulkLookupResult(
                result({
                    catalog_state: 'wishlist',
                }),
            ),
        ).toBe('needs_review')
    })

    it.each([
        'owned',
        'unshelved',
        'ambiguous',
    ] as const)(
        'classifies %s catalog matches as already existing',
        (catalogState) => {
            expect(
                classifyBulkLookupResult(
                    result({
                        catalog_state: catalogState,
                    }),
                ),
            ).toBe('already_exists')
        },
    )

    it.each([
        'not_found',
        'invalid_isbn',
        'provider_timeout',
        'provider_failure',
    ] as const)(
        'classifies %s lookup results as incomplete',
        (status) => {
            expect(
                classifyBulkLookupResult(
                    result({ status }),
                ),
            ).toBe('incomplete')
        },
    )

    it('provides visible text instead of relying on status color', () => {
        expect(
            bulkAddStatusLabel('already_exists'),
        ).toBe('Already Exists')

        expect(
            bulkAddLookupDetail({
                clientItemId: 'scan-1',
                isbn: 'bad-isbn',
                status: 'incomplete',
                lookupResult: result({
                    status: 'invalid_isbn',
                }),
            }),
        ).toContain('not a valid ISBN')
    })
})
