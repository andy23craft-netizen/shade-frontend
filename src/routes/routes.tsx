import { createBrowserRouter } from 'react-router-dom'
import { LegacyCheckinRedirect } from './LegacyCheckinRedirect'
import { AppShell } from '../layout/AppShell'
import { LegacyCheckoutRedirect } from './LegacyCheckoutRedirect'
import {
    AboutPage,
    BookDetailsPage,
    BooksPage,
    BulkAddPage,
    CollectionsPage,
    DashboardPage,
    DeleteBookPage,
    EditBookPage,
    HomePage,
    LoansPage,
    ManageCollectionPage,
    MarkReadPage,
    NewBookPage,
    NotFoundPage,
    ReadingEditPage,
    ShelvesPage,
    StashPage,
    WishlistsPage,
    AlbumsPage,
    NewAlbumPage,
    AlbumDetailsPage,
    EditAlbumPage,
} from './lazyRoutePages'
import { routeMetadata } from './routeMetadata'

export const routeConfig = [
    {
        element: <AppShell />,
        children: [
            {
                path: routeMetadata.home.path,
                handle: {
                    title: routeMetadata.home.title,
                },
                element: <HomePage />,
            },
            {
                path: routeMetadata.about.path,
                handle: {
                    title: routeMetadata.about.title,
                },
                element: <AboutPage />,
            },
            {
                path: routeMetadata.dashboard.path,
                handle: {
                    title: routeMetadata.dashboard.title,
                },
                element: <DashboardPage />,
            },
            {
                path: routeMetadata.books.path,
                handle: {
                    title: routeMetadata.books.title,
                },
                element: <BooksPage />,
            },
            { path: routeMetadata.albums.path, handle: { title: routeMetadata.albums.title }, element: <AlbumsPage /> },
            { path: routeMetadata.newAlbum.path, handle: { title: routeMetadata.newAlbum.title }, element: <NewAlbumPage /> },
            { path: routeMetadata.editAlbum.path, handle: { title: routeMetadata.editAlbum.title }, element: <EditAlbumPage /> },
            { path: routeMetadata.albumDetails.path, handle: { title: routeMetadata.albumDetails.title }, element: <AlbumDetailsPage /> },
            {
                path: routeMetadata.stash.path,
                handle: { title: routeMetadata.stash.title },
                element: <StashPage />,
            },
            {
                path: routeMetadata.wishlists.path,
                handle: {
                    title: routeMetadata.wishlists.title,
                },
                element: <WishlistsPage />,
            },
            {
                path: routeMetadata.collections.path,
                handle: {
                    title: routeMetadata.collections.title,
                },
                element: <CollectionsPage />,
            },
            {
                path: routeMetadata.manageCollection.path,
                handle: {
                    title: routeMetadata.manageCollection.title,
                },
                element: <ManageCollectionPage />,
            },
            {
                path: routeMetadata.newBook.path,
                handle: {
                    title: routeMetadata.newBook.title,
                },
                element: <NewBookPage />,
            },
            {
                path: routeMetadata.bulkAdd.path,
                handle: {
                    title: routeMetadata.bulkAdd.title,
                },
                element: <BulkAddPage />,
            },
            {
                path: routeMetadata.bookDetails.path,
                handle: {
                    title: routeMetadata.bookDetails.title,
                },
                element: <BookDetailsPage />,
            },
            {
                path: routeMetadata.markRead.path,
                handle: {
                    title: routeMetadata.markRead.title,
                },
                element: <MarkReadPage />,
            },
            {
                path: routeMetadata.reading.path,
                handle: {
                    title: routeMetadata.reading.title,
                },
                element: <ReadingEditPage />,
            },
            {
                path: routeMetadata.editBook.path,
                handle: {
                    title: routeMetadata.editBook.title,
                },
                element: <EditBookPage />,
            },
            {
                path: routeMetadata.deleteBook.path,
                handle: {
                    title: routeMetadata.deleteBook.title,
                },
                element: <DeleteBookPage />,
            },
            {
                path: routeMetadata.checkout.path,
                element: <LegacyCheckoutRedirect />,
            },
            {
                path: routeMetadata.checkin.path,
                element: <LegacyCheckinRedirect />,
            },
            {
                path: routeMetadata.loans.path,
                handle: {
                    title: routeMetadata.loans.title,
                },
                element: <LoansPage />,
            },
            {
                path: routeMetadata.shelves.path,
                handle: {
                    title: routeMetadata.shelves.title,
                },
                element: <ShelvesPage />,
            },
            {
                path: routeMetadata.notFound.path,
                handle: {
                    title: routeMetadata.notFound.title,
                },
                element: <NotFoundPage />,
            },
        ],
    },
]

export const router = createBrowserRouter(routeConfig)
