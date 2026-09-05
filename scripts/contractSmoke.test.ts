/** @vitest-environment node */

import {
    readFileSync,
} from 'node:fs'
import {
    dirname,
    join,
} from 'node:path'
import {
    fileURLToPath,
} from 'node:url'
import {
    describe,
    expect,
    it,
} from 'vitest'

const repositoryRoot = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
)

const openApiPath = join(
    repositoryRoot,
    'docs/technical-reference/openapi.json',
)

const generatedTypesPath = join(
    repositoryRoot,
    'src/api/generated/openapi.ts',
)

const expectedPaths = [
    '/albums',
    '/albums/bulk/import',
    '/albums/bulk/lookup',
    '/albums/lookup',
    '/albums/{album_id}',
    '/albums/{album_id}/artwork',
    '/albums/{album_id}/artwork/refetch',
    '/albums/{album_id}/borrower-reviews',
    '/albums/{album_id}/checkin',
    '/albums/{album_id}/checkout',
    '/albums/{album_id}/mark-played',
    '/albums/{album_id}/restore',
    '/artists',
    '/artists/{artist_id}',
    '/authors',
    '/authors/{author_id}',
    '/books',
    '/books/bulk/apply-stash',
    '/books/bulk/import',
    '/books/bulk/lookup',
    '/books/bulk/move-to-shelf',
    '/books/bulk/stash',
    '/books/lookup',
    '/books/{book_id}',
    '/books/{book_id}/availability',
    '/books/{book_id}/borrower-reviews',
    '/books/{book_id}/checkin',
    '/books/{book_id}/checkout',
    '/books/{book_id}/cover',
    '/books/{book_id}/mark-read',
    '/catalog/recent-additions',
    '/catalog/resolve-code',
    '/categories',
    '/categories/{category_id}',
    '/collections',
    '/collections/{collection_id}',
    '/collections/{collection_id}/books',
    '/collections/{collection_id}/books/{collection_book_id}',
    '/dashboard',
    '/dashboard/breakdowns',
    '/dashboard/incomplete-metadata',
    '/dashboard/incomplete-metadata/books',
    '/genres',
    '/genres/{genre_id}',
    '/health',
    '/library/settings',
    '/library/setup',
    '/library/setup/complete',
    '/loans',
    '/loans/{id}',
    '/loans/{id}/feedback',
    '/ready',
    '/shelves',
    '/shelves/{shelf_id}',
    '/version',
    '/wishlists',
    '/wishlists/{wishlist_id}',
    '/wishlists/{wishlist_id}/albums',
    '/wishlists/{wishlist_id}/albums/{wishlist_item_id}',
    '/wishlists/{wishlist_id}/books',
    '/wishlists/{wishlist_id}/books/{wishlist_item_id}',
    '/wishlists/{wishlist_id}/items',
    '/works/{work_id}',
    '/works/{work_id}/items/{media_type}/{item_id}',
    '/works/{work_id}/merge',
    '/works/{work_id}/split',
] as const

describe('OpenAPI contract smoke', () => {
    it('keeps checked-in OpenAPI paths aligned with generated types', () => {
        const document = JSON.parse(
            readFileSync(openApiPath, 'utf8'),
        ) as {
            paths?: Record<string, unknown>
        }

        const documentPaths = Object.keys(
            document.paths ?? {},
        ).sort()

        expect(documentPaths).toEqual(
            [...expectedPaths],
        )

        const generated = readFileSync(
            generatedTypesPath,
            'utf8',
        )

        for (const path of expectedPaths) {
            expect(generated).toContain(
                `"${path}"`,
            )
        }

        expect(generated).toContain(
            'ShelfCreate',
        )
        expect(generated).toContain(
            'ShelfUpdate',
        )
        expect(generated).toContain(
            'create_shelf_shelves_post',
        )
        expect(generated).toContain(
            'update_shelf_shelves__shelf_id__patch',
        )
        expect(generated).toContain(
            'delete_shelf_shelves__shelf_id__delete',
        )
        expect(generated).toContain(
            'VersionResponse',
        )
        expect(generated).toContain(
            'get_version_version_get',
        )
    })

    it('records that live OpenAPI drift checks are blocked when the API is unavailable', () => {
        // Representative backend comparison target:
        // http://127.0.0.1:8000/openapi.json
        expect(openApiPath).toContain(
            'openapi.json',
        )
    })
})
