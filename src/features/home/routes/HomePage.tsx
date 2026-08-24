import {
    AppLink,
    LoadingState,
} from '../../../components'
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
    useRecentBooks,
} from '../../../api/booksQueries'
import {
    HomeStaffPick,
} from '../components/HomeStaffPick'
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
import {
    HomeRecentBook,
} from '../components/HomeRecentBook'

const STAFF_PICKS_NAME = 'Staff Picks'

export function HomePage() {
    const breakdownsQuery =
        useDashboardBreakdowns()

    const categoriesQuery =
        useCategories()

    const collectionsQuery =
        useCollections()

    const recentBooksQuery =
        useRecentBooks()

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

    const recentBooks =
        recentBooksQuery.data?.items ?? []

    const categoriesPending =
        breakdownsQuery.isPending ||
        categoriesQuery.isPending

    const categoriesError =
        breakdownsQuery.isError ||
        categoriesQuery.isError

    return (
        <section className="route-page home-page">
            <div className="home-page__intro">
                <h1 tabIndex={-1}>
                    Shade Library
                </h1>

                <p>
                    Find something worth reading.
                </p>
            </div>

            <section
                aria-labelledby="home-staff-picks-heading"
            >
                <h2 id="home-staff-picks-heading">
                    Staff Picks
                </h2>

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

            <section
                aria-labelledby="home-categories-heading"
            >
                <h2 id="home-categories-heading">
                    Browse the Stacks
                </h2>

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
                    <ul>
                        {categories.map(
                            (category) => (
                                <li
                                    key={
                                        category.categoryId
                                    }
                                >
                                    <AppLink
                                        to={homeCategoryHref(
                                            category.categoryId,
                                        )}
                                    >
                                        {
                                            category.name
                                        }
                                    </AppLink>

                                    <span>
                                        {' '}
                                        (
                                        {
                                            category.count
                                        }
                                        )
                                    </span>
                                </li>
                            ),
                        )}
                    </ul>
                ) : null}

                <AppLink to="/books">
                    Browse All Books
                </AppLink>
            </section>

            <section
                aria-labelledby="home-recent-heading"
            >
                <h2 id="home-recent-heading">
                    New Additions
                </h2>

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
                        {recentBooks.map(
                            (book) => (
                                <HomeRecentBook
                                    key={book.id}
                                    book={book}
                                />
                            ),
                        )}
                    </HomeBookCarousel>
                ) : null}
            </section>

            <nav aria-label="Home shortcuts">
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
