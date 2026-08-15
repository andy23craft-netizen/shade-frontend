import { Field } from '../../../components/Field'
import type {
    BookSortBy,
    BookSortOrder,
} from '../booksListModel'
import {
    sortByLabel,
    sortOrderLabel,
} from '../booksListModel'

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
    sortBy: BookSortBy
    sortOrder: BookSortOrder
    onSortByChange: (sortBy: BookSortBy) => void
    onSortOrderChange: (sortOrder: BookSortOrder) => void
}

export function BooksListControls({
    sortBy,
    sortOrder,
    onSortByChange,
    onSortOrderChange,
}: BooksListControlsProps) {
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
        </div>
    )
}
