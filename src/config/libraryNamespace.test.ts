import { describe, expect, it } from 'vitest'
import { requireLibraryClientNamespace, resolveLibraryClientNamespace } from './libraryNamespace'

describe('library client namespace', () => {
    it('scopes state by normalized host and media', () => {
        expect(resolveLibraryClientNamespace('TENANT-A.EXAMPLE.TEST.', 'album')).toEqual({
            libraryId: 'tenant-a.example.test', media: 'album', key: 'shade:tenant-a.example.test:album',
        })
    })
    it('does not require a frontend host allowlist', () => {
        expect(requireLibraryClientNamespace('tenant-b.example.test').key).toBe('shade:tenant-b.example.test:shared')
    })
})
