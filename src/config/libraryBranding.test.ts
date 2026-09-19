import { describe, expect, it } from 'vitest'
import { getLibraryBranding } from './libraryBranding'
import { resolveLibraryContext } from './libraryContext'

describe('getLibraryBranding', () => {
    it('uses neutral, host-independent startup branding', () => {
        expect(getLibraryBranding(resolveLibraryContext('tenant-a.example.test'))).toEqual({
            header: null, hero: null, showHomeQuote: false,
        })
    })
})
