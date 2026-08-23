import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    clearSelectedBookIds,
    getSelectedBookIdentities,
    isBookBulkSelectable,
    reconcileSelectedBookIds,
    selectVisibleEligibleBookIds,
    toggleSelectedBookId,
    type BulkSelectableBook,
} from './bulkSelectionModel'

function makeBook(
    overrides: Partial<BulkSelectableBook> = {},
): BulkSelectableBook {
    return {
        id: 'book-1',
        title: 'The Left Hand of Darkness',
        deletion_date: null,
        ...overrides,
    }
}

describe('bulkSelectionModel', () => {
    it('treats active books as eligible for bulk selection', () => {
        expect(
            isBookBulkSelectable(makeBook()),
        ).toBe(true)
    })

    it('treats soft-deleted books as ineligible for bulk selection', () => {
        expect(
            isBookBulkSelectable(
                makeBook({
                    deletion_date:
                        '2026-08-23T12:00:00Z',
                }),
            ),
        ).toBe(false)
    })

    it('adds an unselected book when toggled', () => {
        const selectedIds =
            toggleSelectedBookId(
                new Set(),
                'book-1',
            )

        expect([...selectedIds]).toEqual([
            'book-1',
        ])
    })

    it('removes an already selected book when toggled again', () => {
        const initiallySelected =
            new Set(['book-1'])

        const selectedIds =
            toggleSelectedBookId(
                initiallySelected,
                'book-1',
            )

        expect([...selectedIds]).toEqual([])
    })

    it('does not mutate the existing selected-ID set while toggling', () => {
        const initiallySelected =
            new Set(['book-1'])

        toggleSelectedBookId(
            initiallySelected,
            'book-2',
        )

        expect(
            [...initiallySelected],
        ).toEqual(['book-1'])
    })

    it('selects every currently visible eligible book', () => {
        const selectedIds =
            selectVisibleEligibleBookIds([
                makeBook({
                    id: 'book-1',
                }),
                makeBook({
                    id: 'book-2',
                    title: 'Pale Fire',
                }),
            ])

        expect([...selectedIds]).toEqual([
            'book-1',
            'book-2',
        ])
    })

    it('excludes soft-deleted books from Select All', () => {
        const selectedIds =
            selectVisibleEligibleBookIds([
                makeBook({
                    id: 'active-book',
                }),
                makeBook({
                    id: 'deleted-book',
                    deletion_date:
                        '2026-08-23T12:00:00Z',
                }),
            ])

        expect([...selectedIds]).toEqual([
            'active-book',
        ])
    })

    it('clears all selected IDs', () => {
        const selectedIds =
            clearSelectedBookIds()

        expect([...selectedIds]).toEqual([])
    })

    it('clears selection when the canonical result identity changes', () => {
        const selectedIds =
            reconcileSelectedBookIds(
                new Set([
                    'book-1',
                    'book-2',
                ]),
                [
                    makeBook({
                        id: 'book-1',
                    }),
                    makeBook({
                        id: 'book-2',
                    }),
                ],
                true,
            )

        expect([...selectedIds]).toEqual([])
    })

    it('preserves selected IDs that remain visible and eligible', () => {
        const selectedIds =
            reconcileSelectedBookIds(
                new Set([
                    'book-1',
                    'book-2',
                ]),
                [
                    makeBook({
                        id: 'book-1',
                    }),
                    makeBook({
                        id: 'book-2',
                    }),
                    makeBook({
                        id: 'book-3',
                    }),
                ],
                false,
            )

        expect([...selectedIds]).toEqual([
            'book-1',
            'book-2',
        ])
    })

    it('removes selected IDs that are no longer visible', () => {
        const selectedIds =
            reconcileSelectedBookIds(
                new Set([
                    'book-1',
                    'book-2',
                ]),
                [
                    makeBook({
                        id: 'book-1',
                    }),
                ],
                false,
            )

        expect([...selectedIds]).toEqual([
            'book-1',
        ])
    })

    it('removes selected IDs that become ineligible', () => {
        const selectedIds =
            reconcileSelectedBookIds(
                new Set([
                    'book-1',
                    'book-2',
                ]),
                [
                    makeBook({
                        id: 'book-1',
                    }),
                    makeBook({
                        id: 'book-2',
                        deletion_date:
                            '2026-08-23T12:00:00Z',
                    }),
                ],
                false,
            )

        expect([...selectedIds]).toEqual([
            'book-1',
        ])
    })

    it('returns selected book IDs and titles for downstream actions', () => {
        const selectedBooks =
            getSelectedBookIdentities(
                [
                    makeBook({
                        id: 'book-1',
                        title: 'The Left Hand of Darkness',
                    }),
                    makeBook({
                        id: 'book-2',
                        title: 'Pale Fire',
                    }),
                    makeBook({
                        id: 'book-3',
                        title: 'Invisible Cities',
                    }),
                ],
                new Set([
                    'book-1',
                    'book-3',
                ]),
            )

        expect(selectedBooks).toEqual([
            {
                id: 'book-1',
                title: 'The Left Hand of Darkness',
            },
            {
                id: 'book-3',
                title: 'Invisible Cities',
            },
        ])
    })

    it('does not expose soft-deleted selected books to downstream actions', () => {
        const selectedBooks =
            getSelectedBookIdentities(
                [
                    makeBook({
                        id: 'active-book',
                        title: 'Active Book',
                    }),
                    makeBook({
                        id: 'deleted-book',
                        title: 'Deleted Book',
                        deletion_date:
                            '2026-08-23T12:00:00Z',
                    }),
                ],
                new Set([
                    'active-book',
                    'deleted-book',
                ]),
            )

        expect(selectedBooks).toEqual([
            {
                id: 'active-book',
                title: 'Active Book',
            },
        ])
    })
})
