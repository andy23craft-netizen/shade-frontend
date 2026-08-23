import { useState } from 'react'

import type { CategoryRead } from '../../../api/apiTypes'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import {
    sortByLabel,
    sortOrderLabel,
    type BookSortBy,
    type BookSortOrder,
} from '../booksListModel'
import { sortCategoriesByName } from '../categoryDisplay'

const SORT_BY_OPTIONS: readonly BookSortBy[] = [
    'author',
    'title',
    'creationDate',
    'shelf',
]

const SORT_ORDER_OPTIONS: readonly BookSortOrder[] = [
    'asc',
    'desc',
]

export interface BooksListControlsProps {
    categories: readonly CategoryRead[]
    categoryIds: readonly string[]
    author: string
    title: string
    isRead: boolean | undefined
    sortBy: BookSortBy
    sortOrder: BookSortOrder
    onCategoryIdsChange: (
        categoryIds: string[],
    ) => void
    onReadStatusChange: (
        isRead: boolean | undefined,
    ) => void
    onApply: (
        author: string,
        title: string,
    ) => void
    onClear: () => void
    onSortByChange: (sortBy: BookSortBy) => void
    onSortOrderChange: (sortOrder: BookSortOrder) => void
}

export function BooksListControls({
                                      categories,
                                      categoryIds,
                                      author,
                                      title,
                                      isRead,
                                      sortBy,
                                      sortOrder,
                                      onCategoryIdsChange,
                                      onReadStatusChange,
                                      onApply,
                                      onClear,
                                      onSortByChange,
                                      onSortOrderChange,
                                  }: BooksListControlsProps) {
    const [authorDraft, setAuthorDraft] = useState(author)
    const [titleDraft, setTitleDraft] = useState(title)
    const [categoryPickerOpen, setCategoryPickerOpen] =
        useState(false)
    const [categorySearch, setCategorySearch] =
        useState('')

    const sortedCategories =
        sortCategoriesByName(categories)
    const selected = new Set(categoryIds)

    const selectedCategories =
        sortedCategories.filter((category) =>
            selected.has(category.category_id),
        )

    const normalizedCategorySearch =
        categorySearch.trim().toLowerCase()

    const visibleCategories =
        normalizedCategorySearch === ''
            ? sortedCategories
            : sortedCategories.filter((category) =>
                category.name
                    .toLowerCase()
                    .includes(normalizedCategorySearch),
            )

    function toggleCategoryId(
        categoryId: string,
    ) {
        const next = new Set(selected)

        if (next.has(categoryId)) {
            next.delete(categoryId)
        } else {
            next.add(categoryId)
        }

        onCategoryIdsChange(
            [...next].sort(),
        )
    }

    function clearCategoryId(
        categoryId: string,
    ) {
        onCategoryIdsChange(
            categoryIds
                .filter(
                    (selectedCategoryId) =>
                        selectedCategoryId !==
                        categoryId,
                )
                .sort(),
        )
    }

    return (
        <div className="books-page__controls">
            <div className="books-page__filters">
                <div className="books-page__category-filter">
                    <div className="books-page__category-filter-heading">
                        <div>
                            <span className="books-page__category-filter-label">
                                Categories
                            </span>

                            <p className="books-page__category-filter-help">
                                Choose multiple categories to
                                match books in all selected
                                categories.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="books-page__category-picker-toggle"
                            aria-expanded={
                                categoryPickerOpen
                            }
                            aria-controls="books-category-picker"
                            onClick={() => {
                                setCategoryPickerOpen(
                                    (open) => !open,
                                )
                            }}
                        >
                            {categoryPickerOpen
                                ? 'Close'
                                : selected.size > 0
                                    ? `Select (${selected.size})`
                                    : 'Select'}
                            <span
                                aria-hidden="true"
                                className="books-page__category-picker-chevron"
                            >
                                {categoryPickerOpen
                                    ? '▴'
                                    : '▾'}
                            </span>
                        </button>
                    </div>

                    {selectedCategories.length > 0 ? (
                        <div
                            className="books-page__selected-categories"
                            aria-label="Selected categories"
                        >
                            {selectedCategories.map(
                                (category) => (
                                    <button
                                        key={
                                            category.category_id
                                        }
                                        type="button"
                                        className="books-page__selected-category"
                                        aria-label={`Remove ${category.name} category filter`}
                                        onClick={() => {
                                            clearCategoryId(
                                                category.category_id,
                                            )
                                        }}
                                    >
                                        <span>
                                            {
                                                category.name
                                            }
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className="books-page__selected-category-remove"
                                        >
                                            ×
                                        </span>
                                    </button>
                                ),
                            )}
                        </div>
                    ) : (
                        <p className="books-page__category-filter-empty">
                            All categories
                        </p>
                    )}

                    {categoryPickerOpen ? (
                        <div
                            id="books-category-picker"
                            className="books-page__category-picker"
                        >
                            <Field label="Find a category">
                                <input
                                    className="field__control"
                                    type="search"
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
                            </Field>

                            <fieldset className="books-page__category-options">
                                <legend className="visually-hidden">
                                    Category filters
                                </legend>

                                {visibleCategories.length >
                                0 ? (
                                    <div className="books-page__category-options-list">
                                        {visibleCategories.map(
                                            (
                                                category,
                                            ) => (
                                                <label
                                                    key={
                                                        category.category_id
                                                    }
                                                    htmlFor={`books-filter-category-${category.category_id}`}
                                                    className="books-page__category-option"
                                                >
                                                    <input
                                                        id={`books-filter-category-${category.category_id}`}
                                                        type="checkbox"
                                                        checked={selected.has(
                                                            category.category_id,
                                                        )}
                                                        onChange={() =>
                                                            toggleCategoryId(
                                                                category.category_id,
                                                            )
                                                        }
                                                    />

                                                    <span>
                                                        {
                                                            category.name
                                                        }
                                                    </span>
                                                </label>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="books-page__category-no-results">
                                        No categories match
                                        that search.
                                    </p>
                                )}
                            </fieldset>
                        </div>
                    ) : null}
                </div>

                <Field label="Author">
                    <input
                        className="field__control"
                        type="search"
                        value={authorDraft}
                        onChange={(event) => {
                            setAuthorDraft(
                                event.target.value,
                            )
                        }}
                    />
                </Field>

                <Field label="Title">
                    <input
                        className="field__control"
                        type="search"
                        value={titleDraft}
                        onChange={(event) => {
                            setTitleDraft(
                                event.target.value,
                            )
                        }}
                    />
                </Field>

                <Field label="Read status">
                    <select
                        className="field__control"
                        value={
                            isRead === undefined
                                ? ''
                                : String(isRead)
                        }
                        onChange={(event) => {
                            const value = event.target.value

                            if (value === 'true') {
                                onReadStatusChange(true)
                                return
                            }

                            if (value === 'false') {
                                onReadStatusChange(false)
                                return
                            }

                            onReadStatusChange(undefined)
                        }}
                    >
                        <option value="">All</option>
                        <option value="true">Read</option>
                        <option value="false">Unread</option>
                    </select>
                </Field>
            </div>

            <div className="books-page__filter-actions">
                <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                        onApply(
                            authorDraft,
                            titleDraft,
                        )
                    }}
                >
                    Apply
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                        setAuthorDraft('')
                        setTitleDraft('')
                        setCategorySearch('')
                        onClear()
                    }}
                >
                    Clear
                </Button>
            </div>

            <div className="books-page__sort">
                <Field label="Sort by">
                    <select
                        className="field__control"
                        value={sortBy}
                        onChange={(event) => {
                            onSortByChange(
                                event.target
                                    .value as BookSortBy,
                            )
                        }}
                    >
                        {SORT_BY_OPTIONS.map(
                            (value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {sortByLabel(
                                        value,
                                    )}
                                </option>
                            ),
                        )}
                    </select>
                </Field>

                <Field label="Sort direction">
                    <select
                        className="field__control"
                        value={sortOrder}
                        onChange={(event) => {
                            onSortOrderChange(
                                event.target
                                    .value as BookSortOrder,
                            )
                        }}
                    >
                        {SORT_ORDER_OPTIONS.map(
                            (value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {sortOrderLabel(
                                        value,
                                    )}
                                </option>
                            ),
                        )}
                    </select>
                </Field>
            </div>
        </div>
    )
}
