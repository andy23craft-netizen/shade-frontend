/** Tenant identity and branding are server-owned. Startup is deliberately neutral. */
export type LibraryId = string
export type LibraryPalette = 'neutral'
export type TypographyAccent = 'neutral'
export type IdentityAsset = string

export interface LibraryIdentity {
    id: string
    libraryName: string
    wordmark: string
    tagline: string | null
    palette: LibraryPalette
    typographyAccent: TypographyAccent
    assets: Readonly<{ header: IdentityAsset | null; hero: IdentityAsset | null }>
    motifs: readonly string[]
    personalityCopy: Readonly<{ homeQuote: boolean; emptyCatalog: string | null }>
    seasonalVariants: readonly never[]
}

export const NEUTRAL_LIBRARY_IDENTITY: LibraryIdentity = {
    id: 'unknown', libraryName: 'Library', wordmark: 'Library', tagline: null,
    palette: 'neutral', typographyAccent: 'neutral',
    assets: { header: null, hero: null }, motifs: [],
    personalityCopy: { homeQuote: false, emptyCatalog: null }, seasonalVariants: [],
}

export function getLibraryIdentity(_id?: LibraryId | null): LibraryIdentity {
    void _id
    return NEUTRAL_LIBRARY_IDENTITY
}

/** @deprecated Tenant catalogues are no longer shipped in the frontend. */
export function getKnownLibraryIdentity(_id: LibraryId): LibraryIdentity {
    void _id
    return NEUTRAL_LIBRARY_IDENTITY
}
