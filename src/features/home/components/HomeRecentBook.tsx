import {
    AppLink,
} from '../../../components'
import { formatBookAuthors } from '../../books/authorDisplay'
import type {
    BookRead,
} from '../../../api/apiTypes'
import {
    formatShelfCommonNameForDisplay,
} from '../../shelves/shelfDisplay'
import {
    BookCover,
} from '../../books/components/BookCover'

interface HomeRecentBookProps {
    book: BookRead
}

export function HomeRecentBook({
                                   book,
                               }: HomeRecentBookProps) {
    const publicationYear =
        book.publication_date?.slice(0, 4)

    const shelf =
        book.shelf_name
            ? formatShelfCommonNameForDisplay(
                book.shelf_name,
            )
            : null

    return (
        <li className="home-book-carousel__item">
            <article className="book-card book-card--compact">
                <div className="book-card__cover">
                    <BookCover
                        bookId={book.id}
                        title={book.title}
                        status={book.status}
                        decorative
                    />
                </div>

                <div className="book-card__content">
                    <div className="book-card__heading">
                    <h3 className="book-card__title">
                        <AppLink
                            to={`/books/${encodeURIComponent(
                                book.id,
                            )}`}
                        >
                            {book.title}
                        </AppLink>
                    </h3>

                        <p className="book-card__author">
                            {formatBookAuthors(book.authors)}
                        </p>
                </div>

                <dl className="book-card__metadata">
                    {publicationYear ? (
                        <div className="book-card__field">
                            <dt>Year</dt>
                            <dd>{publicationYear}</dd>
                        </div>
                    ) : null}

                    {shelf ? (
                        <div className="book-card__field">
                            <dt>Shelf</dt>
                            <dd>{shelf}</dd>
                        </div>
                    ) : null}
                </dl>
                </div>
            </article>
        </li>
    )
}
