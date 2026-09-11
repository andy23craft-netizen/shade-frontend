import { lazy } from 'react'

export const HomePage = lazy(() =>
    import('../features/home/routes/HomePage').then(
        (module) => ({
            default: module.HomePage,
        }),
    ),
)

export const ReadingRoomPage = lazy(() => import('../features/rooms/routes/ReadingRoomPage').then(module => ({ default: module.ReadingRoomPage })))
export const ListeningRoomPage = lazy(() => import('../features/rooms/routes/ListeningRoomPage').then(module => ({ default: module.ListeningRoomPage })))
export const ListeningDashboardPage = lazy(() => import('../features/dashboard/routes/ListeningDashboardPage').then(module => ({ default: module.ListeningDashboardPage })))
export const AlbumLoansPage = lazy(() => import('../features/loans/routes/AlbumLoansPage').then(module => ({ default: module.AlbumLoansPage })))

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

export const AlbumsPage = lazy(() => import('../features/albums/routes/AlbumsPage').then(module => ({ default: module.AlbumsPage })))
export const CatalogImageSearchPage = lazy(() => import('../features/catalog/routes/CatalogImageSearchPage').then(module => ({ default: module.CatalogImageSearchPage })))
export const AlbumLabelsPage = lazy(() => import('../features/albums/routes/AlbumLabelsPage').then(module => ({ default: module.AlbumLabelsPage })))
export const NewAlbumPage = lazy(() => import('../features/albums/routes/NewAlbumPage').then(module => ({ default: module.NewAlbumPage })))
export const AlbumBulkAddPage = lazy(() => import('../features/albums/routes/AlbumBulkAddPage').then(module => ({ default: module.AlbumBulkAddPage })))
export const AlbumDetailsPage = lazy(() => import('../features/albums/routes/AlbumDetailsPage').then(module => ({ default: module.AlbumDetailsPage })))
export const EditAlbumPage = lazy(() => import('../features/albums/routes/EditAlbumPage').then(module => ({ default: module.EditAlbumPage })))

export const StashPage = lazy(() =>
    import('../features/books/routes/StashPage').then(
        (module) => ({ default: module.StashPage }),
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

export const QuoteLibraryPage = lazy(() => import('../features/quotes/routes/QuoteLibraryPage').then((module) => ({ default: module.QuoteLibraryPage })))

export const LibrarySettingsPage = lazy(() =>
    import('../features/library/routes/LibrarySettingsPage').then(
        (module) => ({ default: module.LibrarySettingsPage }),
    ),
)

export const LibrarySetupPage = lazy(() =>
    import('../features/library/routes/LibrarySetupPage').then(
        (module) => ({ default: module.LibrarySetupPage }),
    ),
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

export const BookLabelsPage = lazy(() => import('../features/books/routes/BookLabelsPage').then((module) => ({ default: module.BookLabelsPage })))

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
