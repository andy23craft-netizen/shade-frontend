import type { CategoryRead } from '../../../api/apiTypes'
import { Field } from '../../../components/Field'
import type {
    BookSortBy,
    BookSortOrder,
} from '../booksListModel'
import {
    sortByLabel,
    sortOrderLabel,
} from '../booksListModel'
import { sortCategoriesByName } from '../categoryDisplay'
import { Button } from '../../../components/Button'
import { useState } from 'react'

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
    sortBy: BookSortBy
    sortOrder: BookSortOrder
    onCategoryIdsChange: (
        categoryIds: string[],
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
    sortBy,
    sortOrder,
    onCategoryIdsChange,
    onApply,
    onClear,
    onSortByChange,
    onSortOrderChange,
}: BooksListControlsProps) {
    const [authorDraft, setAuthorDraft] = useState(author)
    const [titleDraft, setTitleDraft] = useState(title)
    const sortedCategories =
        sortCategoriesByName(categories)
    const selected = new Set(categoryIds)

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

    return (
        <div className="books-page__controls">
            <div className="books-page__filters">
                <fieldset className="book-form__categories books-page__category-filter">
                    <legend>Categories</legend>

                    <div className="book-form__categories-list">
                        {sortedCategories.map(
                            (category) => (
                                <label
                                    key={
                                        category.category_id
                                    }
                                    htmlFor={`books-filter-category-${category.category_id}`}
                                    className="book-form__category-option"
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
                                    {category.name}
                                </label>
                            ),
                        )}
                    </div>
                </fieldset>

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
                        {SORT_BY_OPTIONS.map((value) => (
                            <option
                                key={value}
                                value={value}
                            >
                                {sortByLabel(value)}
                            </option>
                        ))}
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
                        {SORT_ORDER_OPTIONS.map((value) => (
                            <option
                                key={value}
                                value={value}
                            >
                                {sortOrderLabel(value)}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
        </div>
    )
}
