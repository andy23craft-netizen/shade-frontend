import {
    AppLink,
    LoadingState,
} from '../../../components'
import {
    useBook,
} from '../../../api/booksQueries'
import {
    formatShelfCommonNameForDisplay,
} from '../../shelves/shelfDisplay'

interface HomeStaffPickProps {
    bookId: string
}

export function HomeStaffPick({
                                  bookId,
                              }: HomeStaffPickProps) {
    const bookQuery = useBook(bookId)

    if (bookQuery.isPending) {
        return (
            <div className="home-book-deck__item">
                <div className="book-card book-card--compact">
                    <LoadingState label="Loading staff pick…" />
                </div>
            </div>
        )
    }

    if (
        bookQuery.isError ||
        bookQuery.data === undefined ||
        bookQuery.data.deletion_date !== null
    ) {
        return null
    }

    const book = bookQuery.data

    const publicationYear =
        book.publication_date?.slice(0, 4)

    const shelf =
        formatShelfCommonNameForDisplay(
            book.shelf_name,
        )

    return (
        <div className="home-book-deck__item">
            <article className="book-card book-card--compact">
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

                    {book.authors ? (
                        <p className="book-card__author">
                            {book.authors}
                        </p>
                    ) : null}
                </div>

                <dl className="book-card__metadata">
                    {publicationYear ? (
                        <div className="book-card__field">
                            <dt>Year</dt>
                            <dd>{publicationYear}</dd>
                        </div>
                    ) : null}

                    <div className="book-card__field">
                        <dt>Shelf</dt>
                        <dd>{shelf}</dd>
                    </div>
                </dl>
            </article>
        </div>
    )
}
