import { describe, expect, it } from 'vitest'
import {
    applyLibraryTheme,
    resolveLibraryContext,
} from './libraryContext'

describe('resolveLibraryContext', () => {
    it.each([
        ['andy.localhost', 'andy'],
        ['ANDY.LOCALHOST', 'andy'],
        ['andy.library.spir.es', 'andy'],
        ['andy.example.test', 'andy'],
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

describe('applyLibraryTheme', () => {
    it('sets an allowlisted library theme on the document root', () => {
        const root = document.createElement('html')

        applyLibraryTheme(resolveLibraryContext('jamie.localhost'), root)

        expect(root.dataset.library).toBe('jamie')
    })

    it('sets the generic theme for an unknown library', () => {
        const root = document.createElement('html')

        applyLibraryTheme(null, root)

        expect(root.dataset.library).toBe('unknown')
    })
})
