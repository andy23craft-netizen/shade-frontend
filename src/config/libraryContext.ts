export const DEFAULT_LOCAL_LIBRARY_HOST = 'andy.localhost'

import {
    getKnownLibraryIdentity,
    getLibraryIdentity,
    type LibraryId,
} from './libraryIdentity'

export type { LibraryId } from './libraryIdentity'

export interface LibraryContext {
    id: LibraryId
    name: string
    wordmark: string
}

const LIBRARIES: Readonly<Record<LibraryId, LibraryContext>> = {
    andy: {
        id: 'andy',
        name: getKnownLibraryIdentity('andy').libraryName,
        wordmark: getKnownLibraryIdentity('andy').wordmark,
    },
    dalmo: {
        id: 'dalmo',
        name: getKnownLibraryIdentity('dalmo').libraryName,
        wordmark: getKnownLibraryIdentity('dalmo').wordmark,
    },
    jamie: {
        id: 'jamie',
        name: getKnownLibraryIdentity('jamie').libraryName,
        wordmark: getKnownLibraryIdentity('jamie').wordmark,
    },
}

const PUBLIC_HOST_ALIASES: Readonly<Record<string, LibraryId>> = {
    'shade.library.spir.es': 'andy',
}

function isLibraryId(value: string): value is LibraryId {
    return Object.hasOwn(LIBRARIES, value)
}

export function resolveLibraryContext(
    hostname: string,
): LibraryContext | null {
    const normalizedHostname = hostname
        .trim()
        .toLowerCase()
        .replace(/\.$/u, '')

    if (
        normalizedHostname === 'localhost' ||
        normalizedHostname === '127.0.0.1'
    ) {
        return LIBRARIES.andy
    }

    const aliasedLibraryId = PUBLIC_HOST_ALIASES[normalizedHostname]
    if (aliasedLibraryId) {
        return LIBRARIES[aliasedLibraryId]
    }

    const [libraryId = ''] = normalizedHostname.split('.')

    return isLibraryId(libraryId)
        ? LIBRARIES[libraryId]
        : null
}

export function applyLibraryTheme(
    context: LibraryContext | null,
    root: HTMLElement = document.documentElement,
): void {
    const identity = getLibraryIdentity(context?.id)
    root.dataset.library = identity.palette
    root.dataset.typographyAccent = identity.typographyAccent
}

export function formatLibraryDocumentTitle(
    pageTitle: string,
    context: LibraryContext | null,
): string {
    const libraryName = getLibraryIdentity(context?.id).libraryName

    return `${pageTitle} — ${libraryName} — Shade`
}

export function applyLibraryDocumentMetadata(
    context: LibraryContext | null,
    pageTitle: string,
    target: Document = document,
): void {
    const libraryName = getLibraryIdentity(context?.id).libraryName

    target.title = formatLibraryDocumentTitle(pageTitle, context)

    for (const [attribute, name] of [
        ['property', 'og:title'],
        ['name', 'twitter:title'],
    ] as const) {
        let element = target.head.querySelector<HTMLMetaElement>(
            `meta[${attribute}="${name}"]`,
        )

        if (!element) {
            element = target.createElement('meta')
            element.setAttribute(attribute, name)
            target.head.append(element)
        }

        element.content = libraryName
    }
}

export function getLibraryDisplayName(
    context: LibraryContext | null,
): string {
    return getLibraryIdentity(context?.id).wordmark
}
