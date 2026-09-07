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

    it('uses Dalmo-specific header and hero artwork', () => {
        const branding = getLibraryBranding(
            resolveLibraryContext('dalmo.library.spir.es'),
        )

        expect(branding.header).toContain('Dalmo_header.webp')
        expect(branding.hero).toContain('Dalmo_hero.webp')
        expect(branding.showHomeQuote).toBe(true)
    })

    it('uses Shade artwork for Andy', () => {
        const branding = getLibraryBranding(
            resolveLibraryContext('shade.library.spir.es'),
        )

        expect(branding.header).toContain('Shade_Library_Header.webp')
        expect(branding.hero).toContain('Shade_Library_Hero.webp')
        expect(branding.showHomeQuote).toBe(true)
    })

    it('does not borrow a known library identity for an unknown host', () => {
        const branding = getLibraryBranding(null)

        expect(branding).toEqual({
            header: null,
            hero: null,
            showHomeQuote: false,
        })
    })
})
