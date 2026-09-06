import dalmoHeader from '../assets/Dalmo_header.webp'
import dalmoHero from '../assets/Dalmo_hero.webp'
import jamiesHeader from '../assets/Jamies_header.webp'
import jamiesHero from '../assets/Jamies_hero.webp'
import shadeHeader from '../assets/Shade_Library_Header.webp'
import shadeHero from '../assets/Shade_Library_Hero.webp'
import type { LibraryContext } from './libraryContext'

interface LibraryBranding {
    header: string
    hero: string
    showHomeQuote: boolean
}

const SHADE_BRANDING: LibraryBranding = {
    header: shadeHeader,
    hero: shadeHero,
    showHomeQuote: true,
}

const JAMIE_BRANDING: LibraryBranding = {
    header: jamiesHeader,
    hero: jamiesHero,
    showHomeQuote: false,
}

const DALMO_BRANDING: LibraryBranding = {
    header: dalmoHeader,
    hero: dalmoHero,
    showHomeQuote: true,
}

export function getLibraryBranding(
    context: LibraryContext | null,
): LibraryBranding {
    if (context?.id === 'jamie') {
        return JAMIE_BRANDING
    }

    if (context?.id === 'dalmo') {
        return DALMO_BRANDING
    }

    return SHADE_BRANDING
}
