import { useBook } from '../../../api/booksQueries'
import { AppLink } from '../../../components'
import { formatBookAuthors } from '../authorDisplay'
import { formatShelfCommonNameForDisplay } from '../../shelves/shelfDisplay'

function displayDate(value: string): string {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? value
        : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export function ExistingBookCopyLink({ bookId }: { bookId: string }) {
    const query = useBook(bookId)

    if (query.isPending) return <span>Loading copy details…</span>
    if (query.isError) return <AppLink to={`/books/${bookId}`}>Use existing copy</AppLink>

    const book = query.data
    return (
        <AppLink to={`/books/${book.book_id}`}>
            Use {book.title} — {formatBookAuthors(book.authors)} —{' '}
            {book.shelf_name ? formatShelfCommonNameForDisplay(book.shelf_name) : 'Unshelved'} —{' '}
            {book.status} — added {displayDate(book.creation_date)}
        </AppLink>
    )
}
