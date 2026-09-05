import { describe, expect, it } from 'vitest'
import { getLibraryBranding } from './libraryBranding'
import { resolveLibraryContext } from './libraryContext'

describe('getLibraryBranding', () => {
    it('uses Jamie-specific header and hero artwork', () => {
        const branding = getLibraryBranding(
            resolveLibraryContext('jamie.library.spir.es'),
        )

        expect(branding.header).toContain('Jamies_header.webp')
        expect(branding.hero).toContain('Jamies_hero.webp')
        expect(branding.showHomeQuote).toBe(false)
    })

    it('keeps Shade artwork for Andy and Dalmo', () => {
        for (const hostname of [
            'shade.library.spir.es',
            'dalmo.library.spir.es',
        ]) {
            const branding = getLibraryBranding(
                resolveLibraryContext(hostname),
            )

            expect(branding.header).toContain(
                'Shade_Library_Header.webp',
            )
            expect(branding.hero).toContain(
                'Shade_Library_Hero.webp',
            )
            expect(branding.showHomeQuote).toBe(true)
        }
    })
})
