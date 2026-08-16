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
import {
    APP_VERSION,
} from '../src/config/appVersion'

const repositoryRoot = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
)

describe('application version', () => {
    it('keeps APP_VERSION aligned with package.json version', () => {
        const packageJson = JSON.parse(
            readFileSync(
                join(repositoryRoot, 'package.json'),
                'utf8',
            ),
        ) as {
            version?: string
        }

        expect(packageJson.version).toBeTruthy()
        expect(typeof packageJson.version).toBe(
            'string',
        )
        expect(packageJson.version?.trim()).not.toBe(
            '',
        )
        expect(APP_VERSION).toBe(
            packageJson.version?.trim(),
        )
    })
})
