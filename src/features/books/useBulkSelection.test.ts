import {
    act,
    renderHook,
} from '@testing-library/react'
import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    useBulkSelection,
} from './useBulkSelection'
import type {
    BulkSelectableBook,
} from './utils/bulkSelectionModel'

function makeBook(
    overrides: Partial<BulkSelectableBook> = {},
): BulkSelectableBook {
    return {
        book_id: 'book-1',
        title: 'The Left Hand of Darkness',
        ...overrides,
    }
}

describe('useBulkSelection', () => {
    it('starts with no selected books', () => {
        const {
            result,
        } = renderHook(() =>
            useBulkSelection({
                books: [
                    makeBook(),
                ],
                resultIdentity: 'all-books',
            }),
        )

        expect(result.current.selectedCount).toBe(0)
        expect(
            [...result.current.selectedIds],
        ).toEqual([])
        expect(
            result.current.selectedBooks,
        ).toEqual([])
    })

    it('toggles an individual book', () => {
        const {
            result,
        } = renderHook(() =>
            useBulkSelection({
                books: [
                    makeBook(),
                ],
                resultIdentity: 'all-books',
            }),
        )

        act(() => {
            result.current.toggle('book-1')
        })

        expect(result.current.selectedCount).toBe(1)
        expect(
            result.current.isSelected('book-1'),
        ).toBe(true)

        act(() => {
            result.current.toggle('book-1')
        })

        expect(result.current.selectedCount).toBe(0)
        expect(
            result.current.isSelected('book-1'),
        ).toBe(false)
    })

    it('selects every currently visible eligible book', () => {
        const books = [
            makeBook({
                book_id: 'book-1',
            }),
            makeBook({
                book_id: 'book-2',
                title: 'Pale Fire',
            }),
            makeBook({
                book_id: 'deleted-book',
                title: 'Deleted Book',
            }),
        ]

        const {
            result,
        } = renderHook(() =>
            useBulkSelection({
                books,
                resultIdentity: 'all-books',
            }),
        )

        act(() => {
            result.current.selectVisible()
        })

        expect(result.current.selectedCount).toBe(3)

        expect(
            [...result.current.selectedIds],
        ).toEqual([
            'book-1',
            'book-2',
            'deleted-book',
        ])

        expect(
            result.current.isSelected(
                'deleted-book',
            ),
        ).toBe(true)
    })

    it('clears the current selection', () => {
        const {
            result,
        } = renderHook(() =>
            useBulkSelection({
                books: [
                    makeBook(),
                ],
                resultIdentity: 'all-books',
            }),
        )

        act(() => {
            result.current.toggle('book-1')
        })

        expect(result.current.selectedCount).toBe(1)

        act(() => {
            result.current.clear()
        })

        expect(result.current.selectedCount).toBe(0)
    })

    it('exposes selected book identity for downstream actions', () => {
        const books = [
            makeBook({
                book_id: 'book-1',
                title: 'The Left Hand of Darkness',
            }),
            makeBook({
                book_id: 'book-2',
                title: 'Pale Fire',
            }),
        ]

        const {
            result,
        } = renderHook(() =>
            useBulkSelection({
                books,
                resultIdentity: 'all-books',
            }),
        )

        act(() => {
            result.current.toggle('book-2')
        })

        expect(
            result.current.selectedBooks,
        ).toEqual([
            {
                book_id: 'book-2',
                title: 'Pale Fire',
            },
        ])
    })

    it('preserves selection when more books load into the same result set', () => {
        const initialBooks = [
            makeBook({
                book_id: 'book-1',
            }),
        ]

        const {
            result,
            rerender,
        } = renderHook(
            ({
                 books,
                 resultIdentity,
             }) =>
                useBulkSelection({
                    books,
                    resultIdentity,
                }),
            {
                initialProps: {
                    books: initialBooks,
                    resultIdentity:
                        'all-books',
                },
            },
        )

        act(() => {
            result.current.toggle('book-1')
        })

        rerender({
            books: [
                ...initialBooks,
                makeBook({
                    book_id: 'book-2',
                    title: 'Pale Fire',
                }),
            ],
            resultIdentity:
                'all-books',
        })

        expect(result.current.selectedCount).toBe(1)
        expect(
            result.current.isSelected('book-1'),
        ).toBe(true)
    })

    it('removes a selected book when it disappears from the visible result set', () => {
        const book1 = makeBook({
            book_id: 'book-1',
        })

        const book2 = makeBook({
            book_id: 'book-2',
            title: 'Pale Fire',
        })

        const {
            result,
            rerender,
        } = renderHook(
            ({
                 books,
             }) =>
                useBulkSelection({
                    books,
                    resultIdentity:
                        'all-books',
                }),
            {
                initialProps: {
                    books: [
                        book1,
                        book2,
                    ],
                },
            },
        )

        act(() => {
            result.current.toggle('book-2')
        })

        expect(result.current.selectedCount).toBe(1)

        rerender({
            books: [
                book1,
            ],
        })

        expect(result.current.selectedCount).toBe(0)
    })

    it('clears selection when the result identity changes', () => {
        const books = [
            makeBook(),
        ]

        const {
            result,
            rerender,
        } = renderHook(
            ({
                 resultIdentity,
             }) =>
                useBulkSelection({
                    books,
                    resultIdentity,
                }),
            {
                initialProps: {
                    resultIdentity:
                        'all-books',
                },
            },
        )

        act(() => {
            result.current.toggle('book-1')
        })

        expect(result.current.selectedCount).toBe(1)

        rerender({
            resultIdentity:
                'author=ursula',
        })

        expect(result.current.selectedCount).toBe(0)
    })
})
