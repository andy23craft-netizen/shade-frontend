import { AppLink } from '../../../components'
import type { PhysicalItemSummary, Status } from '../../../api/apiTypes'
import { AlbumArtwork } from '../../albums/components/AlbumArtwork'
import { BookCover } from '../../books/components/BookCover'

export function HomeRecentAddition({ item }: { item: PhysicalItemSummary }) {
    const isAlbum = item.media_type === 'album'
    const route = isAlbum ? `/albums/${encodeURIComponent(item.item_id)}` : `/books/${encodeURIComponent(item.item_id)}`
    return <li className="home-book-carousel__item">
        <article className="book-card book-card--compact">
            <div className="book-card__cover">{isAlbum ? <AlbumArtwork albumId={item.item_id} title={item.title} /> : <BookCover bookId={item.item_id} title={item.title} status={item.status as Status} decorative />}</div>
            <div className="book-card__content"><div className="book-card__heading"><h3 className="book-card__title"><AppLink to={route}>{item.title}</AppLink></h3><p className="book-card__author">{item.primary_creator}</p></div><dl className="book-card__metadata"><div className="book-card__field"><dt>{isAlbum ? 'Crate' : 'Shelf'}</dt><dd>{item.shelf_name ?? 'Unfiled'}</dd></div></dl></div>
        </article>
    </li>
}
