import { describe, expect, it } from 'vitest'
import {
    allocateGuidedSetupClientItemId,
    createGuidedSetupSession,
    guidedSetupStorageKey,
    loadGuidedSetupSession,
    saveGuidedSetupSession,
    selectGuidedSetupMedia,
    setGuidedSetupDestination,
} from './guidedSetupSession'

function memoryStorage() {
    const values = new Map<string, string>()
    return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
    }
}

describe('guided setup session', () => {
    it('uses the canonical library namespace and isolates known owners', () => {
        expect(guidedSetupStorageKey('shade.library.spir.es')).toBe('shade:andy:shared:guided-setup:v1')
        expect(guidedSetupStorageKey('dalmo.library.spir.es')).not.toBe(guidedSetupStorageKey('jamie.library.spir.es'))
    })

    it('refuses to persist setup state for an unknown host', () => {
        expect(() => guidedSetupStorageKey('unknown.library.spir.es')).toThrow(/unknown library host/i)
    })

    it('round trips media and independent book and album destinations', () => {
        const storage = memoryStorage()
        const key = guidedSetupStorageKey('jamie.localhost')
        let session = selectGuidedSetupMedia(createGuidedSetupSession('session-a'), 'book')
        session = setGuidedSetupDestination(session, 'book', { shelfId: 'shelf-1', shelfName: 'reading_room' })
        session = setGuidedSetupDestination(session, 'album', { shelfId: 'crate-1', shelfName: 'blue_crate' })
        saveGuidedSetupSession(storage, key, session)
        expect(loadGuidedSetupSession(storage, key)).toEqual(session)
    })

    it('preserves stable client item sequences across reloads', () => {
        const storage = memoryStorage()
        const key = guidedSetupStorageKey('dalmo.localhost')
        const first = allocateGuidedSetupClientItemId(createGuidedSetupSession('stable-session'), 'book')
        saveGuidedSetupSession(storage, key, first.session)
        const restored = loadGuidedSetupSession(storage, key)
        expect(restored).not.toBeNull()
        const second = allocateGuidedSetupClientItemId(restored!, 'book')
        expect(first.clientItemId).toBe('book-stable-session-1')
        expect(second.clientItemId).toBe('book-stable-session-2')
    })

    it.each(['null', '{}', '{bad json', JSON.stringify({ version: 2 })])('rejects invalid or unsupported persisted data', (raw) => {
        expect(loadGuidedSetupSession({ getItem: () => raw }, 'key')).toBeNull()
    })
})
