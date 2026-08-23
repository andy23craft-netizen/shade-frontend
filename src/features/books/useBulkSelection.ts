import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    clearSelectedBookIds,
    getSelectedBookIdentities,
    reconcileSelectedBookIds,
    selectVisibleEligibleBookIds,
    toggleSelectedBookId,
    type BulkSelectableBook,
    type SelectedBookIdentity,
} from './utils/bulkSelectionModel'

export interface UseBulkSelectionOptions<
    TBook extends BulkSelectableBook,
> {
    books: readonly TBook[]
    resultIdentity: string
}

export interface UseBulkSelectionResult {
    selectedIds: ReadonlySet<string>
    selectedBooks: SelectedBookIdentity[]
    selectedCount: number
    isSelected: (bookId: string) => boolean
    toggle: (bookId: string) => void
    selectVisible: () => void
    clear: () => void
}

function setsAreEqual(
    left: ReadonlySet<string>,
    right: ReadonlySet<string>,
): boolean {
    if (left.size !== right.size) {
        return false
    }

    for (const value of left) {
        if (!right.has(value)) {
            return false
        }
    }

    return true
}

export function useBulkSelection<
    TBook extends BulkSelectableBook,
>({
      books,
      resultIdentity,
  }: UseBulkSelectionOptions<TBook>): UseBulkSelectionResult {
    const [
        selectedIds,
        setSelectedIds,
    ] = useState<Set<string>>(
        clearSelectedBookIds,
    )

    const previousResultIdentityRef =
        useRef(resultIdentity)

    useEffect(() => {
        const resultIdentityChanged =
            previousResultIdentityRef.current !==
            resultIdentity

        setSelectedIds((current) => {
            const next =
                reconcileSelectedBookIds(
                    current,
                    books,
                    resultIdentityChanged,
                )

            return setsAreEqual(current, next)
                ? current
                : next
        })

        previousResultIdentityRef.current =
            resultIdentity
    }, [
        books,
        resultIdentity,
    ])

    const toggle = useCallback(
        (bookId: string) => {
            setSelectedIds((current) =>
                toggleSelectedBookId(
                    current,
                    bookId,
                ),
            )
        },
        [],
    )

    const selectVisible = useCallback(() => {
        setSelectedIds(
            selectVisibleEligibleBookIds(books),
        )
    }, [books])

    const clear = useCallback(() => {
        setSelectedIds(
            clearSelectedBookIds(),
        )
    }, [])

    const isSelected = useCallback(
        (bookId: string) =>
            selectedIds.has(bookId),
        [selectedIds],
    )

    const selectedBooks = useMemo(
        () =>
            getSelectedBookIdentities(
                books,
                selectedIds,
            ),
        [
            books,
            selectedIds,
        ],
    )

    return {
        selectedIds,
        selectedBooks,
        selectedCount: selectedBooks.length,
        isSelected,
        toggle,
        selectVisible,
        clear,
    }
}
