import type { Category } from '../../../api/apiTypes'
import { enumDisplayValue } from '../../../api/enumDisplay'
import { Field } from '../../../components/Field'
import type {
    BookSortBy,
    BookSortOrder,
} from '../booksListModel'
import {
    CATEGORY_FILTER_VALUES,
    sortByLabel,
    sortOrderLabel,
} from '../booksListModel'
import { Button } from '../../../components/Button'

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

function categoryLabel(
    category: Category,
): string {
    const display = enumDisplayValue(
        category,
        CATEGORY_FILTER_VALUES,
    )

    return display.value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) =>
            character.toUpperCase(),
        )
}

export interface BooksListControlsProps {
    category: Category | undefined
    author: string
    title: string
    sortBy: BookSortBy
    sortOrder: BookSortOrder
    onCategoryChange: (
        category: Category | undefined,
    ) => void
    onAuthorChange: (author: string) => void
    onTitleChange: (title: string) => void
    onApply: () => void
    onClear: () => void
    onSortByChange: (sortBy: BookSortBy) => void
    onSortOrderChange: (sortOrder: BookSortOrder) => void
}

export function BooksListControls({
                                      category,
                                      author,
                                      title,
                                      sortBy,
                                      sortOrder,
                                      onCategoryChange,
                                      onAuthorChange,
                                      onTitleChange,
                                      onApply,
                                      onClear,
                                      onSortByChange,
                                      onSortOrderChange,
                                  }: BooksListControlsProps) {
    return (
        <div className="books-page__controls">
            <div className="books-page__filters">
                <Field label="Category">
                    <select
                        className="field__control"
                        value={category ?? ''}
                        onChange={(event) => {
                            const value =
                                event.target.value

                            onCategoryChange(
                                value === ''
                                    ? undefined
                                    : value as Category,
                            )
                        }}
                    >
                        <option value="">
                            All categories
                        </option>

                        {CATEGORY_FILTER_VALUES.map(
                            (value) => (
                                <option
                                    key={value}
                                    value={value}
                                >
                                    {categoryLabel(value)}
                                </option>
                            ),
                        )}
                    </select>
                </Field>

                <Field label="Author">
                    <input
                        className="field__control"
                        type="search"
                        value={author}
                        onChange={(event) => {
                            onAuthorChange(
                                event.target.value,
                            )
                        }}
                    />
                </Field>

                <Field label="Title">
                    <input
                        className="field__control"
                        type="search"
                        value={title}
                        onChange={(event) => {
                            onTitleChange(
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
                    onClick={onApply}
                >
                    Apply
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    onClick={onClear}
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
