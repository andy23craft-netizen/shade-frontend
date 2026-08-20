import { AppLink } from '../../../components/AppLink'

export function ManageCollectionPage() {
    return (
        <section className="route-page manage-collection-page">
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

            <div className="manage-collection-page__actions">
                <AppLink
                    to="/books/new"
                    variant="secondary"
                >
                    Add Book
                </AppLink>

                <AppLink
                    to="/shelves"
                    variant="secondary"
                >
                    Shelves
                </AppLink>

                <AppLink
                    to="/admin/deleted"
                    variant="secondary"
                >
                    Deleted Books
                </AppLink>
            </div>
        </section>
    )
}
