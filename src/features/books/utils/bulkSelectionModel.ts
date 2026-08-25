export interface BulkSelectableBook {
    id: string
    title: string
}

export interface SelectedBookIdentity {
    id: string
    title: string
}

export function isBookBulkSelectable(
    book: BulkSelectableBook,
): boolean {
    return Boolean(book.id)
}

export function toggleSelectedBookId(
    selectedIds: ReadonlySet<string>,
    bookId: string,
): Set<string> {
    const next = new Set(selectedIds)

    if (next.has(bookId)) {
        next.delete(bookId)
    } else {
        next.add(bookId)
    }

    return next
}

export function selectVisibleEligibleBookIds<
    TBook extends BulkSelectableBook,
>(
    books: readonly TBook[],
): Set<string> {
    return new Set(
        books
            .filter(isBookBulkSelectable)
            .map((book) => book.id),
    )
}

export function clearSelectedBookIds(): Set<string> {
    return new Set()
}

export function reconcileSelectedBookIds<
    TBook extends BulkSelectableBook,
>(
    selectedIds: ReadonlySet<string>,
    visibleBooks: readonly TBook[],
    resultIdentityChanged: boolean,
): Set<string> {
    if (resultIdentityChanged) {
        return clearSelectedBookIds()
    }

    const eligibleVisibleIds =
        selectVisibleEligibleBookIds(visibleBooks)

    return new Set(
        [...selectedIds].filter((id) =>
            eligibleVisibleIds.has(id),
        ),
    )
}

export function getSelectedBookIdentities<
    TBook extends BulkSelectableBook,
>(
    books: readonly TBook[],
    selectedIds: ReadonlySet<string>,
): SelectedBookIdentity[] {
    return books
        .filter(
            (book) =>
                isBookBulkSelectable(book) &&
                selectedIds.has(book.id),
        )
        .map((book) => ({
            id: book.id,
            title: book.title,
        }))
}
