import type { LoanRead } from '../../../api/apiTypes'
import { useAlbums } from '../../../api/albumsQueries'
import { useInfiniteLoans } from '../../../api/loansQueries'
import { AppLink, EmptyState, LoadingState, QueryErrorState } from '../../../components'
import { useInfiniteScrollTrigger } from '../../../hooks/useInfiniteScrollTrigger'
import { EditLoanBorrower } from '../components/EditLoanBorrower'
import { BorrowerName } from '../components/BorrowerName'
import { CatalogCodeResolver } from '../../scanning/CatalogCodeResolver'
import { displayLoanDate } from '../loanTemporal'
import { flattenInfiniteListPages } from '../loansListModel'

export function AlbumLoansPage() {
    const loansQuery = useInfiniteLoans({ mediaType: 'album' })
    const albumsQuery = useAlbums()
    const loans = flattenInfiniteListPages<{ items: LoanRead[] }, LoanRead>(loansQuery.data?.pages).filter((loan): loan is LoanRead & { album_id: string } => typeof loan.album_id === 'string' && loan.book_id === null)
    const fetchNextPage = loansQuery.fetchNextPage
    const { getRowRef } = useInfiniteScrollTrigger({ enabled: loansQuery.isSuccess, hasNextPage: loansQuery.hasNextPage, isFetchingNextPage: loansQuery.isFetchingNextPage, fetchNextPage: () => { void fetchNextPage() }, itemCount: loans.length })

    if (loansQuery.isPending || albumsQuery.isPending) return <section className="route-page album-loans-page"><h1 tabIndex={-1}>Album Loans</h1><LoadingState label="Loading album loans…" /></section>
    if (loansQuery.isError || albumsQuery.isError) { const query = loansQuery.isError ? loansQuery : albumsQuery; return <section className="route-page album-loans-page"><h1 tabIndex={-1}>Album Loans</h1><QueryErrorState title="Unable to load album loans" error={query.error} onRetry={() => { void query.refetch() }} /></section> }
    if (loans.length === 0) return <section className="route-page album-loans-page"><h1 tabIndex={-1}>Album Loans</h1><CatalogCodeResolver mediaType="album" /><EmptyState title="No album loan history yet."><p>Albums that are checked out will appear in this ledger.</p><AppLink to="/albums">Browse the Bins</AppLink></EmptyState></section>

    const albums = new Map(albumsQuery.data.items.map(album => [album.album_id, album]))
    const active = loans.filter(loan => loan.returned_at === null)
    const returned = loans.filter(loan => loan.returned_at !== null)
    const title = (albumId: string) => { const album = albums.get(albumId); return album ? <AppLink to={`/albums/${albumId}`}>{album.title}</AppLink> : <span>Album {albumId}</span> }
    const list = (items: Array<LoanRead & { album_id: string }>, state: 'Active' | 'Returned') => items.length === 0 ? <p role="status">No {state.toLowerCase()} album loans.</p> : <ul className="loans-card-list" aria-label={`${state} album loans`}>{items.map((loan, index) => <li key={loan.id} ref={getRowRef(index)}><article className="circulation-record-card circulation-record-card--album"><header className="circulation-record-card__heading"><p className="circulation-record-card__eyebrow">{state}</p><h3>{title(loan.album_id)}</h3></header><dl className="circulation-record-card__metadata"><div><dt>Borrower</dt><dd><BorrowerName>{loan.borrower}</BorrowerName></dd></div><div><dt>Checked Out</dt><dd className="circulation-record-card__date-stamp">{displayLoanDate(loan.checked_out_at)}</dd></div>{loan.returned_at ? <div><dt>Returned</dt><dd className="circulation-record-card__date-stamp">{displayLoanDate(loan.returned_at)}</dd></div> : null}{loan.notes ? <div className="circulation-record-card__metadata-wide"><dt>Notes</dt><dd>{loan.notes}</dd></div> : null}</dl><div className="circulation-record-card__actions"><EditLoanBorrower loan={loan} />{state === 'Active' ? <AppLink to={`/albums/${loan.album_id}`}>Open album to check in</AppLink> : null}</div></article></li>)}</ul>

    return <section className="route-page circulation-page loans-page album-loans-page"><header><p className="album-loans-page__eyebrow">Listening Room · Checkout ledger</p><h1 tabIndex={-1}>Album Loans</h1><p>{loansQuery.data?.pages[0]?.total ?? loans.length} loans in the history.</p></header><CatalogCodeResolver mediaType="album" /><section><h2>Out of the Bins</h2>{list(active, 'Active')}</section><section><h2>Returned to the Bins</h2>{list(returned, 'Returned')}</section></section>
}
