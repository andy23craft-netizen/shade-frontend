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
                            Add books, organize shelves, restore records,
                            and maintain your library.
                        </p>
                    </header>

                    <nav
                        className="manage-collection-page__actions"
                        aria-label="Collection maintenance"
                    >
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

                        <AppLink
                            to="/admin/deleted"
                            className="manage-collection-action"
                        >
                            <span className="manage-collection-action__title">
                                Deleted Books
                            </span>

                            <span className="manage-collection-action__description">
                                Review and restore removed records.
                            </span>

                            <span
                                className="manage-collection-action__arrow"
                                aria-hidden="true"
                            >
                                →
                            </span>
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
