import { AppLink } from '../../../components/AppLink'
import manageCollectionPen from '../../../assets/Manage_Collection_Pen.webp'

export function ManageCollectionPage() {
    return (
        <section className="route-page manage-collection-page">
            <div className="manage-collection-page__workspace">
                <article className="manage-collection-sheet">
                    <header className="manage-collection-page__heading">
                        <p className="manage-collection-page__eyebrow">
                            Collection
                        </p>

                        <h1 tabIndex={-1}>
                            Manage Collection
                        </h1>

                        <p>
                            Add books, organize shelves,
                            and maintain your library.
                        </p>
                    </header>

                    <nav
                        className="manage-collection-page__actions"
                        aria-label="Collection maintenance"
                    >
                        <AppLink to="/books/labels?all=1" className="manage-collection-action">
                            <span className="manage-collection-action__title">Print Every Book Label</span>
                            <span className="manage-collection-action__description">Prepare printable labels for every book in the catalog.</span>
                            <span className="manage-collection-action__arrow" aria-hidden="true">→</span>
                        </AppLink>

                        <AppLink to="/albums/labels?all=1" className="manage-collection-action">
                            <span className="manage-collection-action__title">Print Every Album Label</span>
                            <span className="manage-collection-action__description">Prepare printable labels for every album in the catalog.</span>
                            <span className="manage-collection-action__arrow" aria-hidden="true">→</span>
                        </AppLink>

                        <AppLink
                            to="/library/setup"
                            className="manage-collection-action"
                        >
                            <span className="manage-collection-action__title">
                                Build the Collection
                            </span>

                            <span className="manage-collection-action__description">
                                Resume guided shelf-by-shelf or crate-by-crate intake.
                            </span>

                            <span className="manage-collection-action__arrow" aria-hidden="true">
                                →
                            </span>
                        </AppLink>

                        <AppLink
                            to="/books/new"
                            className="manage-collection-action"
                        >
                            <span className="manage-collection-action__title">
                                Add Book
                            </span>

                            <span className="manage-collection-action__description">
                                Enter a new volume into the catalog.
                            </span>

                            <span
                                className="manage-collection-action__arrow"
                                aria-hidden="true"
                            >
                                →
                            </span>
                        </AppLink>

                        <AppLink
                            to="/books/bulk-add"
                            className="manage-collection-action"
                        >
                            <span className="manage-collection-action__title">
                                Bulk Add
                            </span>

                            <span className="manage-collection-action__description">
                                Scan a shelf of books into the catalog.
                            </span>

                            <span
                                className="manage-collection-action__arrow"
                                aria-hidden="true"
                            >
                                →
                            </span>
                        </AppLink>

                        <AppLink
                            to="/shelves"
                            className="manage-collection-action"
                        >
                            <span className="manage-collection-action__title">
                                Shelves
                            </span>

                            <span className="manage-collection-action__description">
                                Organize the physical collection.
                            </span>

                            <span
                                className="manage-collection-action__arrow"
                                aria-hidden="true"
                            >
                                →
                            </span>
                        </AppLink>

                        <AppLink to="/library/settings" className="manage-collection-action">
                            <span className="manage-collection-action__title">Library Settings</span>
                            <span className="manage-collection-action__description">Configure circulation and special-purpose shelves.</span>
                            <span className="manage-collection-action__arrow" aria-hidden="true">→</span>
                        </AppLink>

                        <AppLink to="/quotes" className="manage-collection-action">
                            <span className="manage-collection-action__title">Quote Library</span>
                            <span className="manage-collection-action__description">Curate the quotations shown on Home.</span>
                            <span className="manage-collection-action__arrow" aria-hidden="true">→</span>
                        </AppLink>

                        <AppLink to="/albums/new" className="manage-collection-action">
                            <span className="manage-collection-action__title">Add Album</span>
                            <span className="manage-collection-action__description">File a new release in the album catalog.</span>
                            <span className="manage-collection-action__arrow" aria-hidden="true">→</span>
                        </AppLink>

                        <AppLink to="/albums/bulk-add" className="manage-collection-action">
                            <span className="manage-collection-action__title">Bulk Add Albums</span>
                            <span className="manage-collection-action__description">Look up and import a stack of releases.</span>
                            <span className="manage-collection-action__arrow" aria-hidden="true">→</span>
                        </AppLink>

                    </nav>
                </article>

                <img
                    className="manage-collection-page__pen"
                    src={manageCollectionPen}
                    alt=""
                    aria-hidden="true"
                />
            </div>
        </section>
    )
}
