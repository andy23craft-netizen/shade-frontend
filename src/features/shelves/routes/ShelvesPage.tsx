import {
    EmptyState,
    LoadingState,
    QueryErrorState,
} from '../../../components'
import {
    useShelves,
} from '../../../api/shelvesQueries'
import {
    formatShelfCommonNameForDisplay,
    isSystemShelfCommonName,
} from '../shelfDisplay'

export function ShelvesPage() {
    const shelvesQuery = useShelves()

    if (shelvesQuery.isPending) {
        return (
            <section className="route-page shelves-page">
                <header>
                    <h1 tabIndex={-1}>
                        Shelves
                    </h1>
                </header>

                <LoadingState label="Loading shelves…" />
            </section>
        )
    }

    if (shelvesQuery.isError) {
        return (
            <section className="route-page shelves-page">
                <header>
                    <h1 tabIndex={-1}>
                        Shelves
                    </h1>
                </header>

                <QueryErrorState
                    error={shelvesQuery.error}
                    onRetry={() => {
                        void shelvesQuery.refetch()
                    }}
                    title="Unable to load shelves"
                />
            </section>
        )
    }

    const shelves = shelvesQuery.data ?? []

    return (
        <section className="route-page shelves-page">
            <header className="shelves-page__heading">
                <h1 tabIndex={-1}>
                    Shelves
                </h1>
                <p>
                    Browse the shelf catalog used
                    when placing books. Catalog
                    edits are unavailable until the
                    backend exposes shelf write
                    routes.
                </p>
            </header>

            {shelves.length === 0 ? (
                <EmptyState title="No shelves yet">
                    The API returned an empty shelf
                    catalog.
                </EmptyState>
            ) : (
                <ul
                    className="shelves-list"
                    aria-label="Shelves"
                >
                    {shelves.map((shelf) => {
                        const isSystem =
                            isSystemShelfCommonName(
                                shelf.common_name,
                            )

                        return (
                            <li
                                key={
                                    shelf.shelf_id
                                }
                                className="shelves-list__item"
                            >
                                <article className="shelf-row">
                                    <header className="shelf-row__heading">
                                        <h2 className="shelf-row__name">
                                            {formatShelfCommonNameForDisplay(
                                                shelf.common_name,
                                            )}
                                        </h2>

                                        {isSystem ? (
                                            <p className="shelf-row__badge">
                                                System shelf
                                            </p>
                                        ) : null}
                                    </header>

                                    <dl className="shelf-row__metadata">
                                        {shelf.location ? (
                                            <div className="shelf-row__field">
                                                <dt>
                                                    Location
                                                </dt>
                                                <dd>
                                                    {
                                                        shelf.location
                                                    }
                                                </dd>
                                            </div>
                                        ) : null}

                                        {shelf.description ? (
                                            <div className="shelf-row__field">
                                                <dt>
                                                    Description
                                                </dt>
                                                <dd>
                                                    {
                                                        shelf.description
                                                    }
                                                </dd>
                                            </div>
                                        ) : null}
                                    </dl>
                                </article>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}
