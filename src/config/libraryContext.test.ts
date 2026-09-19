import { describe, expect, it } from 'vitest'
import { applyLibraryTheme, formatLibraryDocumentTitle, resolveLibraryContext } from './libraryContext'

describe('library context', () => {
    it('uses a normalized host only as a private client namespace', () => {
        expect(resolveLibraryContext('TENANT-A.EXAMPLE.TEST.').id).toBe('tenant-a.example.test')
    })
    it('does not reject arbitrary deployment hosts', () => {
        expect(resolveLibraryContext('tenant-b.example.test').name).toBe('Library')
    })
    it('uses neutral theme and metadata', () => {
        const context = resolveLibraryContext('tenant-a.example.test')
        applyLibraryTheme(context)
        expect(document.documentElement.dataset.library).toBe('neutral')
        expect(formatLibraryDocumentTitle('Books', context)).toBe('Books — Library — Shade')
    })
})
