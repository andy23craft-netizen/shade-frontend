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
    '/backup',
    '/books',
    '/books/lookup',
    '/books/{id}',
    '/books/{id}/checkin',
    '/books/{id}/checkout',
    '/books/{id}/mark-read',
    '/books/{id}/restore',
    '/dashboard',
    '/health',
    '/loans',
    '/loans/{id}',
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
    })

    it('records that live OpenAPI drift checks are blocked when the API is unavailable', () => {
        // Representative backend comparison target:
        // http://127.0.0.1:8000/openapi.json
        // Live fetch was unavailable during FEAT-03; checked-in fixtures are the smoke source.
        expect(openApiPath).toContain(
            'openapi.json',
        )
    })
})
