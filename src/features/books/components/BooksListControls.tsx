import {
    useEffect,
    useRef,
    useState,
    type FormEvent,
} from 'react'

import type {
    CategoryRead,
    ShelfRead,
} from '../../../api/apiTypes'
import { Button } from '../../../components/Button'
import {
    type BookSortBy,
    type BookSortOrder,
} from '../booksListModel'
import {
    sortCategoriesByName,
} from '../categoryDisplay'
import {
    filterAssignableShelves,
    formatShelfCommonNameForDisplay,
} from '../../shelves/shelfDisplay'

export interface BooksListControlsProps {
    categories: readonly CategoryRead[]
    categoryIds: readonly string[]
    shelves: readonly ShelfRead[]
    shelfName?: string
    author?: string
    title?: string
    isRead: boolean | undefined
    sortBy: BookSortBy
    sortOrder: BookSortOrder
    selectionMode: boolean
    onCategoryIdsChange: (
        categoryIds: string[],
    ) => void
    onReadStatusChange: (
        isRead: boolean | undefined,
    ) => void
    onShelfNameChange: (
        shelfName: string | undefined,
    ) => void
    onSearch: (
        search: string,
    ) => void
    onClear: () => void
    onSortChange: (
        sortBy: BookSortBy,
        sortOrder: BookSortOrder,
    ) => void
    onEnterSelectionMode: () => void
}

type SortState =
    | 'none'
    | 'asc'
    | 'desc'

function getSortState(
    field: BookSortBy,
    sortBy: BookSortBy,
    sortOrder: BookSortOrder,
): SortState {
    if (sortBy !== field) {
        return 'none'
    }

    return sortOrder
}

function nextSortState(
    current: SortState,
): SortState {
    switch (current) {
        case 'none':
            return 'asc'
        case 'asc':
            return 'desc'
        case 'desc':
            return 'none'
    }
}

function sortStateLabel(
    state: SortState,
): string {
    switch (state) {
        case 'none':
            return 'None'
        case 'asc':
            return 'Asc'
        case 'desc':
            return 'Desc'
    }
}

export function BooksListControls({
                                      categories,
                                      categoryIds,
                                      shelves,
                                      shelfName,
                                      author,
                                      title,
                                      isRead,
                                      sortBy,
                                      sortOrder,
                                      selectionMode,
                                      onCategoryIdsChange,
                                      onReadStatusChange,
                                      onShelfNameChange,
                                      onSearch,
                                      onClear,
                                      onSortChange,
                                      onEnterSelectionMode,
                                  }: BooksListControlsProps) {
    /*
     * Legacy URLs may still contain separate author/title
     * filters. Prefer author as the value for the new
     * unified search box.
     */
    const normalizedAuthor =
        author ?? ''

    const normalizedTitle =
        title ?? ''

    const initialSearch =
        normalizedAuthor.trim() !== ''
            ? normalizedAuthor
            : normalizedTitle

    const [
        searchDraft,
        setSearchDraft,
    ] = useState<string>(
        () => initialSearch,
    )

    const [
        categoryPickerOpen,
        setCategoryPickerOpen,
    ] = useState(false)

    const [
        categorySearch,
        setCategorySearch,
    ] = useState('')

    const [
        mobileControlsOpen,
        setMobileControlsOpen,
    ] = useState(false)

    const sortedCategories =
        sortCategoriesByName(categories)

    const assignableShelves =
        filterAssignableShelves(shelves)

    const selected =
        new Set(categoryIds)

    const normalizedCategorySearch =
        categorySearch
            .trim()
            .toLowerCase()

    const visibleCategories =
        normalizedCategorySearch === ''
            ? sortedCategories
            : sortedCategories.filter(
                (category) =>
                    category.name
                        .toLowerCase()
                        .includes(
                            normalizedCategorySearch,
                        ),
            )

    const authorSortState =
        getSortState(
            'author',
            sortBy,
            sortOrder,
        )

    const titleSortState =
        getSortState(
            'title',
            sortBy,
            sortOrder,
        )

    const categoryPickerRef =
        useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!categoryPickerOpen) {
            return
        }

        function handlePointerDown(
            event: PointerEvent,
        ) {
            const target =
                event.target

            if (
                !(target instanceof Node) ||
                categoryPickerRef.current?.contains(
                    target,
                )
            ) {
                return
            }

            setCategoryPickerOpen(false)
        }

        function handleEscape(
            event: KeyboardEvent,
        ) {
            if (event.key === 'Escape') {
                setCategoryPickerOpen(false)
            }
        }

        document.addEventListener(
            'pointerdown',
            handlePointerDown,
        )

        document.addEventListener(
            'keydown',
            handleEscape,
        )

        return () => {
            document.removeEventListener(
                'pointerdown',
                handlePointerDown,
            )

            document.removeEventListener(
                'keydown',
                handleEscape,
            )
        }
    }, [categoryPickerOpen])

    function toggleCategoryId(
        categoryId: string,
    ) {
        const next =
            new Set(selected)

        if (next.has(categoryId)) {
            next.delete(categoryId)
        } else {
            next.add(categoryId)
        }

        onCategoryIdsChange(
            [...next].sort(),
        )
    }

    function handleSearchSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        onSearch(searchDraft)
    }

    function cycleSort(
        field: BookSortBy,
        currentState: SortState,
    ) {
        const next =
            nextSortState(
                currentState,
            )

        if (next === 'none') {
            onSortChange(
                'author',
                'asc',
            )
            return
        }

        onSortChange(
            field,
            next,
        )
    }

    function handleClear() {
        setSearchDraft('')
        setCategorySearch('')
        setCategoryPickerOpen(false)

        onClear()
    }

    return (
        <div className="books-toolbar">
            <button
                type="button"
                className="books-toolbar__mobile-toggle"
                aria-expanded={
                    mobileControlsOpen
                }
                aria-controls="books-toolbar-controls"
                onClick={() => {
                    setMobileControlsOpen(
                        (open) => !open,
                    )
                }}
            >
                <span className="books-toolbar__mobile-toggle-label">
                    Filters &amp; search
                    <span aria-hidden="true">
                        {mobileControlsOpen ? '▴' : '▾'}
                    </span>
                </span>
                <span className="books-toolbar__mobile-toggle-hint">
                    {mobileControlsOpen
                        ? 'Tap to collapse controls'
                        : 'Tap to expand controls'}
                </span>
            </button>

            <div
                id="books-toolbar-controls"
                className={
                    mobileControlsOpen
                        ? 'books-toolbar__controls books-toolbar__controls--open'
                        : 'books-toolbar__controls'
                }
            >
                <form
                    className="books-toolbar__search"
                    role="search"
                    onSubmit={
                        handleSearchSubmit
                    }
                >
                    <label
                        htmlFor="books-toolbar-search"
                        className="visually-hidden"
                    >
                        Search author or title
                    </label>

                    <input
                        id="books-toolbar-search"
                        type="search"
                        value={searchDraft}
                        placeholder="Search author or title…"
                        autoComplete="off"
                        onChange={(event) => {
                            setSearchDraft(
                                event.target.value,
                            )
                        }}
                    />

                    <Button
                        type="submit"
                        variant="primary"
                    >
                        Search
                    </Button>
                </form>

                <div
                    ref={categoryPickerRef}
                    className="books-toolbar__category"
                >
                    <button
                        type="button"
                        className="books-toolbar__button"
                        aria-expanded={
                            categoryPickerOpen
                        }
                        aria-controls="books-toolbar-category-picker"
                        onClick={() => {
                            setCategoryPickerOpen(
                                (open) => !open,
                            )
                        }}
                    >
                        Categories
                        {selected.size > 0
                            ? ` (${selected.size})`
                            : ''}
                    </button>

                    {categoryPickerOpen ? (
                        <div
                            id="books-toolbar-category-picker"
                            className="books-toolbar__category-picker"
                        >
                            <label
                                htmlFor="books-toolbar-category-search"
                                className="visually-hidden"
                            >
                                Find a category
                            </label>

                            <input
                                id="books-toolbar-category-search"
                                type="search"
                                placeholder="Find category…"
                                value={
                                    categorySearch
                                }
                                autoComplete="off"
                                onChange={(
                                    event,
                                ) => {
                                    setCategorySearch(
                                        event.target
                                            .value,
                                    )
                                }}
                            />

                            <fieldset className="books-toolbar__category-options">
                                <legend className="visually-hidden">
                                    Category filters
                                </legend>

                                {visibleCategories.length >
                                0 ? (
                                    visibleCategories.map(
                                        (
                                            category,
                                        ) => (
                                            <label
                                                key={
                                                    category.category_id
                                                }
                                                className="books-toolbar__category-option"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(
                                                        category.category_id,
                                                    )}
                                                    onChange={() => {
                                                        toggleCategoryId(
                                                            category.category_id,
                                                        )
                                                    }}
                                                />

                                                <span>
                                                    {
                                                        category.name
                                                    }
                                                </span>
                                            </label>
                                        ),
                                    )
                                ) : (
                                    <p>
                                        No categories match.
                                    </p>
                                )}
                            </fieldset>
                        </div>
                    ) : null}
                </div>

                <label className="books-toolbar__read">
                    <input
                        type="checkbox"
                        checked={
                            isRead === true
                        }
                        onChange={(event) => {
                            onReadStatusChange(
                                event.target
                                    .checked
                                    ? true
                                    : undefined,
                            )
                        }}
                    />

                    <span>Read</span>
                </label>

                <label className="books-toolbar__shelf">
                    <span>Shelf</span>

                    <select
                        aria-label="Shelf"
                        value={shelfName ?? ''}
                        onChange={(event) => {
                            onShelfNameChange(
                                event.target.value ||
                                undefined,
                            )
                        }}
                    >
                        <option value="">
                            All shelves
                        </option>

                        {assignableShelves.map(
                            (shelf) => (
                                <option
                                    key={shelf.shelf_id}
                                    value={shelf.common_name}
                                >
                                    {formatShelfCommonNameForDisplay(
                                        shelf.common_name,
                                    )}
                                </option>
                            ),
                        )}
                    </select>
                </label>

                <button
                    type="button"
                    className="books-toolbar__button books-toolbar__sort"
                    aria-label={`Author sort: ${sortStateLabel(
                        authorSortState,
                    )}`}
                    onClick={() => {
                        cycleSort(
                            'author',
                            authorSortState,
                        )
                    }}
                >
                    <span>Author:</span>
                    <strong>
                        {sortStateLabel(
                            authorSortState,
                        )}
                    </strong>
                </button>

                <button
                    type="button"
                    className="books-toolbar__button books-toolbar__sort"
                    aria-label={`Title sort: ${sortStateLabel(
                        titleSortState,
                    )}`}
                    onClick={() => {
                        cycleSort(
                            'title',
                            titleSortState,
                        )
                    }}
                >
                    <span>Title:</span>
                    <strong>
                        {sortStateLabel(
                            titleSortState,
                        )}
                    </strong>

                </button>

                {!selectionMode ? (
                    <button
                        type="button"
                        className="books-toolbar__button"
                        onClick={
                            onEnterSelectionMode
                        }
                    >
                        Select
                    </button>
                ) : null}

                <button
                    type="button"
                    className="books-toolbar__clear"
                    onClick={handleClear}
                >
                    Clear
                </button>
            </div>
        </div>
    )
}
