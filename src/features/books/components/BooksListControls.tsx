import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import type {
    BookSortBy,
    BookSortOrder,
} from '../booksListModel'
import {
    formatBooksRange,
    sortByLabel,
    sortOrderLabel,
} from '../booksListModel'

const SORT_BY_OPTIONS: readonly BookSortBy[] = [
    'author',
    'title',
    'creationDate',
]

const SORT_ORDER_OPTIONS: readonly BookSortOrder[] = [
    'asc',
    'desc',
]

export interface BooksListControlsProps {
    page: number
    pageSize: number
    skip: number
    total: number
    itemsOnPage: number
    sortBy: BookSortBy
    sortOrder: BookSortOrder
    onSortByChange: (sortBy: BookSortBy) => void
    onSortOrderChange: (sortOrder: BookSortOrder) => void
    onPreviousPage: () => void
    onNextPage: () => void
}

export function BooksListControls({
    page,
    pageSize,
    skip,
    total,
    itemsOnPage,
    sortBy,
    sortOrder,
    onSortByChange,
    onSortOrderChange,
    onPreviousPage,
    onNextPage,
}: BooksListControlsProps) {
    const maxPage = Math.max(
        1,
        Math.ceil(total / pageSize),
    )
    const isFirstPage = page <= 1
    const isLastPage = page >= maxPage

    return (
        <div className="books-page__controls">
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

            <div className="books-page__pagination">
                <p className="books-page__range">
                    {formatBooksRange(
                        skip,
                        itemsOnPage,
                        total,
                    )}
                </p>

                <div className="books-page__pagination-actions">
                    <Button
                        variant="secondary"
                        disabled={isFirstPage}
                        onClick={onPreviousPage}
                    >
                        Previous
                    </Button>

                    <Button
                        variant="secondary"
                        disabled={isLastPage}
                        onClick={onNextPage}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
