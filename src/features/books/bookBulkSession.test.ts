import { describe, expect, it } from 'vitest'
import { bookBulkStorageKey, emptyBulkAddDraft, loadBookBulkSession, saveBookBulkSession, type PersistedBookBulkSession } from './bookBulkSession'

const session: PersistedBookBulkSession = {
    version: 1,
    shelfName: 'west_wall',
    acquisitionSource: '',
    sessionStarted: true,
    queue: [{ clientItemId: 'book-session-4', isbn: '9780140449266', status: 'incomplete' }],
    drafts: { 'book-session-4': { ...emptyBulkAddDraft(), title: 'The Odyssey', authors: 'Homer' } },
    savedIds: [],
    importErrors: [['book-session-4', 'Interrupted']],
    nextClientSequence: 5,
}

describe('book bulk session persistence', () => {
    it('isolates sessions by canonical library identity', () => {
        expect(bookBulkStorageKey('dalmo.library.spir.es')).toBe('shade:dalmo:book:bulk-add:v1')
        expect(bookBulkStorageKey('dalmo.library.spir.es')).not.toBe(bookBulkStorageKey('jamie.library.spir.es'))
    })

    it('round trips unresolved rows and stable client sequence', () => {
        const values = new Map<string, string>()
        const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }
        saveBookBulkSession(storage, 'key', session)
        expect(loadBookBulkSession(storage, 'key')).toEqual(session)
    })

    it('requeues lookup work interrupted by browser closure', () => {
        const raw = JSON.stringify({ ...session, queue: [{ ...session.queue[0], status: 'looking_up' }] })
        expect(loadBookBulkSession({ getItem: () => raw }, 'key')?.queue[0]?.status).toBe('queued')
    })

    it.each(['null', '{}', '{bad', JSON.stringify({ ...session, nextClientSequence: 0 })])('rejects malformed sessions', (raw) => {
        expect(loadBookBulkSession({ getItem: () => raw }, 'key')).toBeNull()
    })
})
