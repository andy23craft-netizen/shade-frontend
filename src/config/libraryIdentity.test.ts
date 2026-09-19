import { describe, expect, it } from 'vitest'
import { getLibraryIdentity, NEUTRAL_LIBRARY_IDENTITY } from './libraryIdentity'

describe('library identity', () => {
    it('is neutral until trusted backend metadata is available', () => {
        expect(getLibraryIdentity('tenant-a')).toBe(NEUTRAL_LIBRARY_IDENTITY)
        expect(NEUTRAL_LIBRARY_IDENTITY).toMatchObject({
            libraryName: 'Library', palette: 'neutral', assets: { header: null, hero: null },
        })
    })
})
