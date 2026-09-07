import dalmoHeader from '../assets/Dalmo_header.webp'
import dalmoHero from '../assets/Dalmo_hero.webp'
import jamiesHeader from '../assets/Jamies_header.webp'
import jamiesHero from '../assets/Jamies_hero.webp'
import shadeHeader from '../assets/Shade_Library_Header.webp'
import shadeHero from '../assets/Shade_Library_Hero.webp'

export type LibraryId = 'andy' | 'dalmo' | 'jamie'

export type LibraryPalette =
    | 'shade'
    | 'dalmo'
    | 'jamie'
    | 'neutral'

export type TypographyAccent =
    | 'literary'
    | 'clean'
    | 'warm'
    | 'neutral'

export type IdentityAsset = string

export interface LibraryIdentity {
    id: LibraryId | 'unknown'
    libraryName: string
    wordmark: string
    tagline: string | null
    palette: LibraryPalette
    typographyAccent: TypographyAccent
    assets: Readonly<{
        header: IdentityAsset | null
        hero: IdentityAsset | null
    }>
    motifs: readonly string[]
    personalityCopy: Readonly<{
        homeQuote: boolean
        emptyCatalog: string | null
    }>
    seasonalVariants: readonly never[]
}

// Identity values are code-owned primitives and imported assets. They are never
// interpreted as HTML, CSS, or paths supplied by a host or API response.
const IDENTITIES: Readonly<Record<LibraryId, LibraryIdentity>> = {
    andy: {
        id: 'andy',
        libraryName: "Andy's Library",
        wordmark: 'Shade Library',
        tagline: 'My home library, made easier to explore.',
        palette: 'shade',
        typographyAccent: 'literary',
        assets: { header: shadeHeader, hero: shadeHero },
        motifs: ['paper', 'wood', 'brass'],
        personalityCopy: {
            homeQuote: true,
            emptyCatalog: null,
        },
        seasonalVariants: [],
    },
    dalmo: {
        id: 'dalmo',
        libraryName: "Dalmo's Library",
        wordmark: "Dalmo's Library",
        tagline: null,
        palette: 'dalmo',
        typographyAccent: 'clean',
        assets: { header: dalmoHeader, hero: dalmoHero },
        motifs: ['paper', 'geometry'],
        personalityCopy: {
            homeQuote: true,
            emptyCatalog: null,
        },
        seasonalVariants: [],
    },
    jamie: {
        id: 'jamie',
        libraryName: "Jamie's Library",
        wordmark: "Jamie's Library",
        tagline: "What's the vibe?",
        palette: 'jamie',
        typographyAccent: 'warm',
        assets: { header: jamiesHeader, hero: jamiesHero },
        motifs: [],
        personalityCopy: {
            homeQuote: false,
            emptyCatalog: null,
        },
        seasonalVariants: [],
    },
}

export const NEUTRAL_LIBRARY_IDENTITY: LibraryIdentity = {
    id: 'unknown',
    libraryName: 'Library',
    wordmark: 'Library',
    tagline: null,
    palette: 'neutral',
    typographyAccent: 'neutral',
    assets: { header: null, hero: null },
    motifs: [],
    personalityCopy: {
        homeQuote: false,
        emptyCatalog: null,
    },
    seasonalVariants: [],
}

export function getKnownLibraryIdentity(id: LibraryId): LibraryIdentity {
    return IDENTITIES[id]
}

export function getLibraryIdentity(
    id: LibraryId | null | undefined,
): LibraryIdentity {
    return id ? IDENTITIES[id] : NEUTRAL_LIBRARY_IDENTITY
}
