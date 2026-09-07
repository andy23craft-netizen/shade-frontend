import { describe, expect, it } from 'vitest'
import {
    getKnownLibraryIdentity,
    getLibraryIdentity,
    NEUTRAL_LIBRARY_IDENTITY,
} from './libraryIdentity'

describe('library identity packages', () => {
    it.each([
        ['andy', "Andy's Library", 'Shade Library', 'shade'],
        ['jamie', "Jamie's Library", "Jamie's Library", 'jamie'],
        ['dalmo', "Dalmo's Library", "Dalmo's Library", 'dalmo'],
    ] as const)(
        'provides bounded copy and approved assets for %s',
        (id, libraryName, wordmark, palette) => {
            const identity = getKnownLibraryIdentity(id)

            expect(identity).toMatchObject({
                id,
                libraryName,
                wordmark,
                palette,
            })
            expect(identity.assets.header).toMatch(/\.(?:webp|png)$/u)
            expect(identity.assets.hero).toMatch(/\.(?:webp|png)$/u)
            expect(identity.libraryName.length).toBeLessThanOrEqual(40)
            expect(identity.tagline?.length ?? 0).toBeLessThanOrEqual(80)
        },
    )

    it('has a deliberate asset-free neutral fallback', () => {
        expect(getLibraryIdentity(null)).toBe(NEUTRAL_LIBRARY_IDENTITY)
        expect(NEUTRAL_LIBRARY_IDENTITY).toMatchObject({
            id: 'unknown',
            libraryName: 'Library',
            wordmark: 'Library',
            palette: 'neutral',
            assets: { header: null, hero: null },
            personalityCopy: { homeQuote: false },
        })
    })

    it('keeps seasonal variants inactive until separately approved', () => {
        for (const id of ['andy', 'jamie', 'dalmo'] as const) {
            expect(getKnownLibraryIdentity(id).seasonalVariants).toEqual([])
        }
    })

    it('records Dalmo\'s approved restrained identity choices', () => {
        expect(getKnownLibraryIdentity('dalmo')).toMatchObject({
            tagline: null,
            typographyAccent: 'clean',
            motifs: ['paper', 'sacred-geometry', 'multilingual-script'],
            personalityCopy: {
                homeQuote: false,
                emptyCatalog: null,
            },
            seasonalVariants: [],
        })
    })
})
