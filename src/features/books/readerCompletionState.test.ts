import { describe, expect, it } from 'vitest'
import { bookCompletionState } from './readerCompletionState'
import type { BookRead } from '../../api/apiTypes'

const book = {
    is_read: false,
    completion_date: null,
    rating: null,
    review: null,
    reader_states: [{ profile_id: 'sam', display_name: 'Sam', has_record: true, is_complete: true, completion_date: '2026-09-27T00:00:00Z', rating: 4, review: 'Done.' }],
} as BookRead

describe('bookCompletionState', () => {
    it('uses personal fields for a selected reader and treats an absent state as unread', () => {
        expect(bookCompletionState(book, 'sam')).toMatchObject({ hasRecord: true, isComplete: true, rating: 4, review: 'Done.' })
        expect(bookCompletionState(book, 'other')).toEqual({ hasRecord: false, isComplete: false, completionDate: undefined, rating: undefined, review: undefined })
        expect(bookCompletionState(book)).toMatchObject({ isComplete: false, rating: null })
    })
})
