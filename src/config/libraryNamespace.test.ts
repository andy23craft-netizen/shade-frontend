import { describe, expect, it } from 'vitest'
import { requireLibraryClientNamespace, resolveLibraryClientNamespace } from './libraryNamespace'

describe('library client namespace', () => {
    it('uses trusted hostname mapping and canonicalizes aliases', () => {
        expect(resolveLibraryClientNamespace('JAMIE.localhost', 'album')).toEqual({ libraryId: 'jamie', media: 'album', key: 'shade:jamie:album' })
        expect(resolveLibraryClientNamespace('shade.library.spir.es', 'book')?.key).toBe('shade:andy:book')
    })

    it('refuses unknown hosts and cannot accept query-selected identity', () => {
        expect(resolveLibraryClientNamespace('unknown.example?library=andy')).toBeNull()
        expect(() => requireLibraryClientNamespace('unknown.example')).toThrow(/unknown library host/i)
    })
})
