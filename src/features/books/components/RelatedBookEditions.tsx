import { useRelatedBookEditions } from '../../../api/booksQueries'
import { AppLink } from '../../../components/AppLink'

export function RelatedBookEditions({ bookId }: { bookId: string }) {
    const related = useRelatedBookEditions(bookId)
    if (!related.data?.items.length) return null

    return <section className="book-details-panel" aria-labelledby="related-editions-title">
        <h2 id="related-editions-title">Other editions of this work</h2>
        <ul className="related-book-editions">
            {related.data.items.filter((edition) => edition.book_id !== bookId).map((edition) => {
                const isEpub = edition.available_formats.includes('epub')
                return <li key={edition.book_id}>
                    <span>{edition.title} · {isEpub ? 'EPUB' : 'Physical'}{edition.available_formats.includes('physical') && isEpub ? ' + physical' : ''}</span>{' '}
                    <AppLink to={`/books/${edition.book_id}`} variant="secondary">View {isEpub ? 'EPUB' : 'physical'} edition</AppLink>
                </li>
            })}
        </ul>
    </section>
}
