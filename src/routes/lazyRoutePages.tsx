import { lazy } from 'react'

export const HomePage = lazy(() =>
    import('../features/home/routes/HomePage').then(
        (module) => ({
            default: module.HomePage,
        }),
    ),
)

export const AboutPage = lazy(() =>
    import('../features/about/routes/AboutPage').then(
        (module) => ({
            default: module.AboutPage,
        }),
    ),
)

export const DashboardPage = lazy(() =>
    import(
        '../features/dashboard/routes/DashboardPage'
    ).then((module) => ({
        default: module.DashboardPage,
    })),
)

export const BooksPage = lazy(() =>
    import('../features/books/routes/BooksPage').then(
        (module) => ({
            default: module.BooksPage,
        }),
    ),
)

export const WishlistsPage = lazy(() =>
    import(
        '../features/wishlists/routes/WishlistsPage'
    ).then((module) => ({
        default: module.WishlistsPage,
    })),
)

export const CollectionsPage = lazy(() =>
    import(
        '../features/collections/routes/CollectionsPage'
    ).then((module) => ({
        default: module.CollectionsPage,
    })),
)

export const ManageCollectionPage = lazy(() =>
    import(
        '../features/collection/routes/ManageCollectionPage'
    ).then((module) => ({
        default: module.ManageCollectionPage,
    })),
)

export const NewBookPage = lazy(() =>
    import('../features/books/routes/NewBookPage').then(
        (module) => ({
            default: module.NewBookPage,
        }),
    ),
)

export const BulkAddPage = lazy(() =>
    import('../features/books/routes/BulkAddPage').then(
        (module) => ({
            default: module.BulkAddPage,
        }),
    ),
)

export const BookDetailsPage = lazy(() =>
    import(
        '../features/books/routes/BookDetailsPage'
    ).then((module) => ({
        default: module.BookDetailsPage,
    })),
)

export const MarkReadPage = lazy(() =>
    import(
        '../features/books/routes/MarkReadPage'
    ).then((module) => ({
        default: module.MarkReadPage,
    })),
)

export const ReadingEditPage = lazy(() =>
    import(
        '../features/books/routes/ReadingEditPage'
    ).then((module) => ({
        default: module.ReadingEditPage,
    })),
)

export const EditBookPage = lazy(() =>
    import('../features/books/routes/EditBookPage').then(
        (module) => ({
            default: module.EditBookPage,
        }),
    ),
)

export const DeleteBookPage = lazy(() =>
    import(
        '../features/books/routes/DeleteBookPage'
    ).then((module) => ({
        default: module.DeleteBookPage,
    })),
)

export const LoansPage = lazy(() =>
    import('../features/loans/routes/LoansPage').then(
        (module) => ({
            default: module.LoansPage,
        }),
    ),
)

export const ShelvesPage = lazy(() =>
    import('../features/shelves/routes/ShelvesPage').then(
        (module) => ({
            default: module.ShelvesPage,
        }),
    ),
)

export const NotFoundPage = lazy(() =>
    import('./NotFoundPage').then((module) => ({
        default: module.NotFoundPage,
    })),
)
