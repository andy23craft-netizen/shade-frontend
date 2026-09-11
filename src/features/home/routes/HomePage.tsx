import {
    AppLink,
    LoadingState,
} from '../../../components'
import {
    HomeCategoryDrawer,
} from '../components/HomeCategoryDrawer'
import {
    useCategories,
} from '../../../api/categoriesQueries'
import {
    useCollections,
    useCollectionBooks,
} from '../../../api/collectionsQueries'
import {
    useDashboardBreakdowns,
} from '../../../api/dashboardQueries'
import {
    useNewReleaseBooks,
    useCurrentReadingBooks,
} from '../../../api/booksQueries'
import { useRecentAdditions } from '../../../api/catalogQueries'
import { useNewReleaseAlbums } from '../../../api/albumsQueries'
import {
    HomeStaffPick,
} from '../components/HomeStaffPick'
import {
    HomeRecentBook,
} from '../components/HomeRecentBook'
import {
    homeCategoryHref,
    topHomeCategories,
} from '../homeDiscoveryModel'
import {
    HomeBookTrack,
} from '../components/HomeBookTrack'
import {
    HomeBookCarousel,
} from '../components/HomeBookCarousel'
import { HomeRecentAddition } from '../components/HomeRecentAddition'
import { formatAlbumArtists } from '../../albums/albumDisplay'
import { getLibraryBranding } from '../../../config/libraryBranding'
import {
    getLibraryDisplayName,
    resolveLibraryContext,
} from '../../../config/libraryContext'
import {
    useMemo,
    useState,
} from 'react'

import {
    randomHomeQuote,
} from '../homeQuotes'
import { homeHeadingsForQuote } from '../homeQuoteHeadings'
import listeningRoomImage from '../../../assets/Listening_Room.png'
import readingRoomImage from '../../../assets/Reading_Room.png'
import { useQuotes } from '../../../api/quotesQueries'
import {
    SeasonalHeroVines,
} from '../../seasonal/SeasonalAtmosphere'

const STAFF_PICKS_NAME = 'Staff Picks'

export function HomePage() {
    const libraryContext = resolveLibraryContext(
        window.location.hostname,
    )
    const libraryName = getLibraryDisplayName(libraryContext)
    const libraryBranding = getLibraryBranding(libraryContext)

    const breakdownsQuery =
        useDashboardBreakdowns()

    const categoriesQuery =
        useCategories()

    const collectionsQuery =
        useCollections()

    const recentBooksQuery = useRecentAdditions()

    const newReleaseBooksQuery =
        useNewReleaseBooks()

    const newReleaseAlbumsQuery =
        useNewReleaseAlbums()

    const currentReadingQuery =
        useCurrentReadingBooks()

    const quotesQuery = useQuotes({ enabled: libraryBranding.showHomeQuote })
    const [quoteChoice] = useState(() => Math.random())
    const [fallbackQuote] = useState(randomHomeQuote)
    const quote = useMemo(() => {
        const enabledQuotes = quotesQuery.data?.items?.filter((item) => item.enabled) ?? []
        return enabledQuotes.length > 0
            ? enabledQuotes[Math.floor(quoteChoice * enabledQuotes.length)]
            : fallbackQuote
    }, [fallbackQuote, quoteChoice, quotesQuery.data])

    const [
        quoteContextOpen,
        setQuoteContextOpen,
    ] = useState(false)

    const staffPicksCollection =
        collectionsQuery.data?.items.find(
            (collection) =>
                collection.name ===
                STAFF_PICKS_NAME,
        )

    const staffPicksQuery =
        useCollectionBooks(
            staffPicksCollection?.collection_id ??
            '',
            {
                enabled:
                    staffPicksCollection !==
                    undefined,
            },
        )

    const categories =
        breakdownsQuery.data !== undefined &&
        categoriesQuery.data !== undefined
            ? topHomeCategories(
                breakdownsQuery.data.by_category,
                categoriesQuery.data,
            )
            : []

    const staffPicks =
        staffPicksCollection === undefined
            ? []
            : staffPicksQuery.data?.items.filter(
            (membership) =>
                membership.shelf_name !== null &&
                membership.shelf_name !==
                undefined &&
                !membership.on_wishlist,
        ) ?? []

    const recentBooks = recentBooksQuery.data ?? []

    const releaseYear = new Date().getFullYear()
    const isCurrentYearRelease = (date: string | null | undefined) => {
        // Release dates without a time are calendar dates. Parsing
        // `2026-01-01` as a timestamp shifts it to the prior local day west
        // of UTC, which incorrectly hides January 1 releases.
        return date?.slice(0, 4) === String(releaseYear)
    }

    const newReleases = [
        ...(newReleaseBooksQuery.data?.items ?? [])
            .filter((book) => isCurrentYearRelease(book.publication_date))
            .map((book) => ({
                mediaType: 'book' as const,
                releaseDate: book.publication_date!,
                book,
            })),
        ...(newReleaseAlbumsQuery.data?.items ?? [])
            .filter((album) => isCurrentYearRelease(album.release_date))
            .map((album) => ({
                mediaType: 'album' as const,
                releaseDate: album.release_date!,
                item: {
                    media_type: 'album' as const,
                    item_id: album.album_id,
                    title: album.title,
                    primary_creator: formatAlbumArtists(album),
                    format: album.media_format,
                    status: album.status,
                    shelf_name: album.shelf_name,
                    checkout_eligible: album.status === 'available',
                    active_loan_id: null,
                },
            })),
    ].sort((left, right) =>
        Date.parse(right.releaseDate) - Date.parse(left.releaseDate),
    ).slice(0, 5)

    const newReleasesPending =
        newReleaseBooksQuery.isPending ||
        newReleaseAlbumsQuery.isPending

    const newReleasesError =
        newReleaseBooksQuery.isError &&
        newReleaseAlbumsQuery.isError

    const currentReading =
        currentReadingQuery.data?.items ?? []

    const categoriesPending =
        breakdownsQuery.isPending ||
        categoriesQuery.isPending

    const categoriesError =
        breakdownsQuery.isError ||
        categoriesQuery.isError
    const homeHeadings = homeHeadingsForQuote(quote)

    return (
        <section className="route-page home-page">
            <div className="home-page__intro">
                <AppLink
                    to="/about"
                    className="home-page__hero-link"
                    aria-label={`About ${libraryName}`}
                >
                    {libraryBranding.hero ? <img
                        src={libraryBranding.hero}
                        alt=""
                        className="home-page__hero-image"
                    /> : <span className="home-page__hero-fallback">
                        {libraryName}
                    </span>}
                    <SeasonalHeroVines />
                </AppLink>

                <h1
                    className="sr-only"
                    tabIndex={-1}
                >
                    {libraryName}
                </h1>

                {libraryBranding.showHomeQuote ? (
                    <div className="home-page__quote">
                        {quote.context ? <button
                            type="button"
                            className="home-page__quote-trigger"
                            aria-expanded={quoteContextOpen}
                            aria-controls="home-quote-context"
                            onClick={() => {
                                setQuoteContextOpen(
                                    (current) => !current,
                                )
                            }}
                        >
        <span className="home-page__quote-text">
            {quote.text}
        </span>

                        <cite className="home-page__quote-author">
                            — {quote.author}
                        </cite>
                        </button> : <blockquote className="home-page__quote-trigger"><span className="home-page__quote-text">{quote.text}</span><cite className="home-page__quote-author">— {quote.author}</cite></blockquote>}

                        {quote.context && quoteContextOpen ? (
                            <p
                                id="home-quote-context"
                                className="home-page__quote-context"
                            >
                                {quote.context}
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <nav className="home-room-links" aria-label="Enter a room">
                <AppLink to="/listening-room">
                    <strong className="home-room-links__label">Listening Room</strong>
                    <img src={listeningRoomImage} alt="" />
                </AppLink>
                <AppLink to="/reading-room">
                    <strong className="home-room-links__label">Reading Room</strong>
                    <img src={readingRoomImage} alt="" />
                </AppLink>
            </nav>

            <section
                className="home-section home-section--recent"
                aria-labelledby="home-recent-heading"
            >
                <h2 id="home-recent-heading" className="home-section__expressive-heading">{homeHeadings.newAdditions}</h2>
                <p className="home-section__functional-heading">New Additions</p>

                {recentBooksQuery.isPending ? (
                    <LoadingState label="Loading new additions…" />
                ) : null}

                {recentBooksQuery.isError ? (
                    <p role="alert">
                        New additions could not be
                        loaded.
                    </p>
                ) : null}

                {!recentBooksQuery.isPending &&
                !recentBooksQuery.isError &&
                recentBooks.length === 0 ? (
                    <p>
                        No new additions are
                        available yet.
                    </p>
                ) : null}

                {recentBooks.length > 0 ? (
                    <HomeBookCarousel ariaLabel="New additions books">
                        {recentBooks.map((item) => <HomeRecentAddition key={`${item.media_type}:${item.item_id}`} item={item} />)}
                    </HomeBookCarousel>
                ) : null}
            </section>

            <section
                className="home-section home-section--new-releases"
                aria-labelledby="home-new-releases-heading"
            >
                <h2 id="home-new-releases-heading" className="home-section__expressive-heading">{homeHeadings.newReleases}</h2>
                <p className="home-section__functional-heading">New Releases</p>
                {newReleasesPending ? <LoadingState label="Loading new releases…" /> : null}
                {newReleasesError ? <p role="alert">New releases could not be loaded.</p> : null}
                {!newReleasesPending && !newReleasesError && newReleases.length === 0 ? (
                    <p>No owned books or albums with release dates this year are available yet.</p>
                ) : null}
                {newReleases.length > 0 ? (
                    <HomeBookCarousel ariaLabel="New releases">
                        {newReleases.map((release) => release.mediaType === 'book'
                            ? <HomeRecentBook key={`book:${release.book.book_id}`} book={release.book} />
                            : <HomeRecentAddition key={`album:${release.item.item_id}`} item={release.item} />)}
                    </HomeBookCarousel>
                ) : null}
            </section>

            <section
                className="home-section home-section--current-reading"
                aria-labelledby="home-current-reading-heading"
            >
                <h2 id="home-current-reading-heading" className="home-section__expressive-heading">{homeHeadings.currentReading}</h2>
                <p className="home-section__functional-heading">Current Reading</p>
                {currentReadingQuery.isPending ? <LoadingState label="Loading current reading…" /> : null}
                {currentReadingQuery.isError ? <p role="alert">Current reading could not be loaded.</p> : null}
                {!currentReadingQuery.isPending && !currentReadingQuery.isError && currentReading.length === 0 ? (
                    <p>Nothing worse than not having a book to read…</p>
                ) : null}
                {currentReading.length > 0 ? (
                    <HomeBookCarousel ariaLabel="Current reading books">
                        {currentReading.map((book) => <HomeRecentBook key={book.book_id} book={book} />)}
                    </HomeBookCarousel>
                ) : null}
            </section>

            <section
                className="home-section home-section--categories"
                aria-labelledby="home-categories-heading"
            >
                <h2 id="home-categories-heading" className="home-section__expressive-heading">{homeHeadings.browse}</h2>
                <p className="home-section__functional-heading">Browse the Stacks</p>

                {categoriesPending ? (
                    <LoadingState label="Loading categories…" />
                ) : null}

                {categoriesError ? (
                    <p role="alert">
                        Featured categories could
                        not be loaded.
                    </p>
                ) : null}

                {!categoriesPending &&
                !categoriesError &&
                categories.length === 0 ? (
                    <p>
                        No featured categories are
                        available yet.
                    </p>
                ) : null}

                {categories.length > 0 ? (
                    <ul className="home-category-drawers">
                        {categories.map(
                            (category) => (
                                <HomeCategoryDrawer
                                    key={
                                        category.categoryId
                                    }
                                    name={
                                        category.name
                                    }
                                    count={
                                        category.count
                                    }
                                    href={homeCategoryHref(category.slug)}
                                />
                            ),
                        )}
                    </ul>
                ) : null}

                <AppLink to="/books">
                    Browse All Books
                </AppLink>
            </section>

            <section
                className="home-section home-section--staff"
                aria-labelledby="home-staff-picks-heading"
            >
                <h2 id="home-staff-picks-heading" className="home-section__expressive-heading">{homeHeadings.staffPicks}</h2>
                <p className="home-section__functional-heading">Staff Picks</p>

                {collectionsQuery.isPending ||
                (staffPicksCollection !==
                    undefined &&
                    staffPicksQuery.isPending) ? (
                    <LoadingState label="Loading staff picks…" />
                ) : null}

                {collectionsQuery.isError ||
                staffPicksQuery.isError ? (
                    <p role="alert">
                        Staff Picks could not be
                        loaded.
                    </p>
                ) : null}

                {!collectionsQuery.isPending &&
                !collectionsQuery.isError &&
                staffPicksCollection ===
                undefined ? (
                    <p>
                        No Staff Picks collection
                        is available.
                    </p>
                ) : null}

                {staffPicksCollection !==
                undefined &&
                !staffPicksQuery.isPending &&
                !staffPicksQuery.isError &&
                staffPicks.length === 0 ? (
                    <p>
                        No shelved Staff Picks are
                        available yet.
                    </p>
                ) : null}

                {staffPicks.length > 0 ? (
                    <HomeBookTrack ariaLabel="Staff Picks books">
                        {staffPicks.map(
                            (membership) => (
                                <HomeStaffPick
                                    key={
                                        membership.collection_book_id
                                    }
                                    bookId={
                                        membership.book_id
                                    }
                                />
                            ),
                        )}
                    </HomeBookTrack>
                ) : null}

                <AppLink to="/collections">
                    Browse Collections
                </AppLink>
            </section>

            <nav
                className="home-shortcuts"
                aria-label="Home shortcuts"
            >
                <AppLink to="/books">
                    Browse
                </AppLink>

                <AppLink to="/collections">
                    Collections
                </AppLink>

                <AppLink to="/wishlists">
                    Wishlists
                </AppLink>

                <AppLink to="/about">
                    About
                </AppLink>
            </nav>
        </section>
    )
}
