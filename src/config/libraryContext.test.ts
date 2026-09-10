import { describe, expect, it } from 'vitest'
import {
    applyLibraryDocumentMetadata,
    applyLibraryFavicon,
    applyLibraryTheme,
    formatLibraryDocumentTitle,
    getLibraryCoverMark,
    resolveLibraryContext,
} from './libraryContext'

describe('resolveLibraryContext', () => {
    it.each([
        ['andy.localhost', 'andy'],
        ['ANDY.LOCALHOST', 'andy'],
        ['shade.library.spir.es', 'andy'],
        ['SHADE.LIBRARY.SPIR.ES.', 'andy'],
        ['andy.example.test', 'andy'],
        ['dalmo.localhost', 'dalmo'],
        ['dalmo.library.spir.es', 'dalmo'],
        ['jamie.localhost', 'jamie'],
        ['jamie.library.spir.es', 'jamie'],
        ['jamie.example.test.', 'jamie'],
    ])('resolves %s from its leftmost label', (hostname, expected) => {
        expect(resolveLibraryContext(hostname)?.id).toBe(expected)
    })

    it.each(['localhost', '127.0.0.1'])(
        'uses Andy for the bare local host %s',
        (hostname) => {
            expect(resolveLibraryContext(hostname)?.id).toBe('andy')
        },
    )

    it.each(['pat.localhost', 'library.spir.es', '', '192.0.2.1'])(
        'rejects the unknown host %s',
        (hostname) => {
            expect(resolveLibraryContext(hostname)).toBeNull()
        },
    )
})

describe('getLibraryCoverMark', () => {
    it.each([
        ['shade.library.spir.es', 'SL'],
        ['dalmo.library.spir.es', 'DL'],
        ['jamie.library.spir.es', 'JL'],
    ])('uses the matching cover initials for %s', (hostname, mark) => {
        expect(getLibraryCoverMark(resolveLibraryContext(hostname))).toBe(mark)
    })
})

describe('applyLibraryFavicon', () => {
    it.each([
        ['shade.library.spir.es', '/favicon-shade.png'],
        ['dalmo.library.spir.es', '/favicon-dalmo.png'],
        ['jamie.localhost', '/favicon-jamie.png'],
    ])('uses the tenant favicon for %s', (hostname, expectedFavicon) => {
            const target = document.implementation.createHTMLDocument()
            const icon = target.createElement('link')
            icon.rel = 'icon'
            icon.href = '/favicon.png'
            target.head.append(icon)

            applyLibraryFavicon(hostname, target)

            expect(icon.getAttribute('href')).toBe(expectedFavicon)
        })

    it('keeps the default favicon for an unknown host', () => {
        const target = document.implementation.createHTMLDocument()
        const icon = target.createElement('link')
        icon.rel = 'icon'
        icon.href = '/favicon.png'
        target.head.append(icon)

        applyLibraryFavicon('unknown.library.spir.es', target)

        expect(icon.getAttribute('href')).toBe('/favicon.png')
    })
})

describe('applyLibraryTheme', () => {
    it('sets an allowlisted library theme on the document root', () => {
        const root = document.createElement('html')

        applyLibraryTheme(resolveLibraryContext('jamie.localhost'), root)

        expect(root.dataset.library).toBe('jamie')
    })

    it('sets the generic theme for an unknown library', () => {
        const root = document.createElement('html')

        applyLibraryTheme(null, root)

        expect(root.dataset.library).toBe('neutral')
        expect(root.dataset.typographyAccent).toBe('neutral')
    })
})

describe('formatLibraryDocumentTitle', () => {
    it.each([
        ['shade.library.spir.es', "Home — Andy's Library — Shade"],
        ['jamie.library.spir.es', "Home — Jamie's Library — Shade"],
        ['dalmo.library.spir.es', "Home — Dalmo's Library — Shade"],
        ['unknown.library.spir.es', 'Home — Library — Shade'],
    ])('formats the title for %s', (hostname, expectedTitle) => {
        expect(
            formatLibraryDocumentTitle(
                'Home',
                resolveLibraryContext(hostname),
            ),
        ).toBe(expectedTitle)
    })

    it('applies tenant-specific preview metadata without markup injection', () => {
        const target = document.implementation.createHTMLDocument()

        applyLibraryDocumentMetadata(
            resolveLibraryContext('dalmo.library.spir.es'),
            'Home',
            target,
        )

        expect(target.title).toBe("Home — Dalmo's Library — Shade")
        expect(
            target.head
                .querySelector('meta[property="og:title"]')
                ?.getAttribute('content'),
        ).toBe("Dalmo's Library")
        expect(
            target.head
                .querySelector('meta[name="twitter:title"]')
                ?.getAttribute('content'),
        ).toBe("Dalmo's Library")
    })
})
