import type { LibraryContext } from './libraryContext'
import { getLibraryIdentity } from './libraryIdentity'

interface LibraryBranding {
    header: string | null
    hero: string | null
    showHomeQuote: boolean
}

export function getLibraryBranding(
    context: LibraryContext | null,
): LibraryBranding {
    const identity = getLibraryIdentity(context?.id)
    return {
        header: identity.assets.header,
        hero: identity.assets.hero,
        showHomeQuote: identity.personalityCopy.homeQuote,
    }
}
