export const DEFAULT_LOCAL_LIBRARY_HOST = 'andy.localhost'

export type LibraryId = 'andy' | 'dalmo' | 'jamie'

export interface LibraryContext {
    id: LibraryId
    name: string
    wordmark: string
}

const LIBRARIES: Readonly<Record<LibraryId, LibraryContext>> = {
    andy: {
        id: 'andy',
        name: "Andy's Library",
        wordmark: 'Shade Library',
    },
    dalmo: {
        id: 'dalmo',
        name: "Dalmo's Library",
        wordmark: "Dalmo's Shade Library",
    },
    jamie: {
        id: 'jamie',
        name: "Jamie's Library",
        wordmark: "Jamie's Shade Library",
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
    root.dataset.library = context?.id ?? 'unknown'
}

export function formatLibraryDocumentTitle(
    pageTitle: string,
    context: LibraryContext | null,
): string {
    const libraryName = context?.name ?? 'Library'

    return `${libraryName} - ${pageTitle}`
}

export function applyLibraryDocumentMetadata(
    context: LibraryContext | null,
    pageTitle: string,
    target: Document = document,
): void {
    const libraryName = context?.name ?? 'Library'

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
    return context?.id === 'andy'
        ? 'Shade Library'
        : context?.name ?? 'Shade Library'
}
