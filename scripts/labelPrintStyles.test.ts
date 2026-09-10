/** @vitest-environment node */

import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('R027 book-label print styles', () => {
    it('prints only the label sheet at the documented 2 by 4 US Letter layout', async () => {
        const styles = await readFile('src/styles/components.css', 'utf8')

        expect(styles).toContain('grid-template-columns: repeat(2, 3.5in)')
        expect(styles).toContain('grid-template-rows: repeat(4, 2in)')
        expect(styles).toContain('column-gap: .5in')
        expect(styles).toContain('row-gap: .5in')
        expect(styles).toContain('height: 9.5in')
        expect(styles).toContain('break-after: page')
        expect(styles).toContain('margin: 0')
        expect(styles).toContain('margin: .75in auto 0')
        expect(styles).toMatch(
            /\.book-labels-page > header,\s*\.no-print\s*\{\s*display: none !important;/u,
        )
    })
})
