import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { LegacyCheckinRedirect } from './LegacyCheckinRedirect'
import { AppShell } from '../layout/AppShell'
import { LegacyCheckoutRedirect } from './LegacyCheckoutRedirect'
import {
    AboutPage,
    BookDetailsPage,
    BooksPage,
    BulkAddPage,
    BookLabelsPage,
    CollectionsPage,
    DashboardPage,
    DeleteBookPage,
    EditBookPage,
    HomePage,
    LoansPage,
    ManageCollectionPage,
    LibrarySettingsPage,
    LibrarySetupPage,
    MarkReadPage,
    NewBookPage,
    NotFoundPage,
    ReadingEditPage,
    ShelvesPage,
    StashPage,
    WishlistsPage,
    AlbumsPage,
    AlbumLabelsPage,
    NewAlbumPage,
    AlbumDetailsPage,
    EditAlbumPage,
    AlbumBulkAddPage,
    ReadingRoomPage,
    ListeningRoomPage,
    ListeningDashboardPage,
    CatalogImageSearchPage,
    AlbumLoansPage,
    QuoteLibraryPage,
    PdfLibraryPage,
    AdminReaderPage,
} from './lazyRoutePages'
import { routeMetadata } from './routeMetadata'
import { RequireAdmin } from '../features/auth/RequireAdmin'

const adminOnly = (page: ReactNode) => <RequireAdmin>{page}</RequireAdmin>

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
            { path: routeMetadata.readingRoom.path, handle: { title: routeMetadata.readingRoom.title }, element: <ReadingRoomPage /> },
            { path: routeMetadata.listeningRoom.path, handle: { title: routeMetadata.listeningRoom.title }, element: <ListeningRoomPage /> },
            {
                path: routeMetadata.dashboard.path,
                handle: {
                    title: routeMetadata.dashboard.title,
                },
                element: adminOnly(<DashboardPage />),
            },
            { path: '/dashboard', element: <Navigate to={routeMetadata.dashboard.path} replace /> },
            { path: routeMetadata.listeningDashboard.path, handle: { title: routeMetadata.listeningDashboard.title }, element: adminOnly(<ListeningDashboardPage />) },
            {
                path: routeMetadata.books.path,
                handle: {
                    title: routeMetadata.books.title,
                },
                element: <BooksPage />,
            },
            { path: '/books/category/:categorySlug', handle: { title: routeMetadata.books.title }, element: <BooksPage /> },
            { path: '/books/shelf/:shelfToken', handle: { title: routeMetadata.books.title }, element: <BooksPage /> },
            { path: routeMetadata.albums.path, handle: { title: routeMetadata.albums.title }, element: <AlbumsPage /> },
            { path: routeMetadata.imageSearch.path, handle: { title: routeMetadata.imageSearch.title }, element: adminOnly(<CatalogImageSearchPage />) },
            { path: routeMetadata.albumLabels.path, handle: { title: routeMetadata.albumLabels.title }, element: adminOnly(<AlbumLabelsPage />) },
            { path: routeMetadata.newAlbum.path, handle: { title: routeMetadata.newAlbum.title }, element: adminOnly(<NewAlbumPage />) },
            { path: routeMetadata.bulkAddAlbums.path, handle: { title: routeMetadata.bulkAddAlbums.title }, element: adminOnly(<AlbumBulkAddPage />) },
            { path: routeMetadata.editAlbum.path, handle: { title: routeMetadata.editAlbum.title }, element: adminOnly(<EditAlbumPage />) },
            { path: routeMetadata.albumDetails.path, handle: { title: routeMetadata.albumDetails.title }, element: <AlbumDetailsPage /> },
            {
                path: routeMetadata.stash.path,
                handle: { title: routeMetadata.stash.title },
                element: adminOnly(<StashPage />),
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
                element: adminOnly(<ManageCollectionPage />),
            },
            { path: routeMetadata.quoteLibrary.path, handle: { title: routeMetadata.quoteLibrary.title }, element: adminOnly(<QuoteLibraryPage />) },
            { path: routeMetadata.pdfLibrary.path, handle: { title: routeMetadata.pdfLibrary.title }, element: adminOnly(<PdfLibraryPage />) },
            { path: routeMetadata.adminReader.path, handle: { title: routeMetadata.adminReader.title }, element: adminOnly(<AdminReaderPage />) },
            {
                path: routeMetadata.librarySetup.path,
                handle: { title: routeMetadata.librarySetup.title },
                element: adminOnly(<LibrarySetupPage />),
            },
            {
                path: routeMetadata.librarySettings.path,
                handle: { title: routeMetadata.librarySettings.title },
                element: adminOnly(<LibrarySettingsPage />),
            },
            {
                path: routeMetadata.newBook.path,
                handle: {
                    title: routeMetadata.newBook.title,
                },
                element: adminOnly(<NewBookPage />),
            },
            {
                path: routeMetadata.bulkAdd.path,
                handle: {
                    title: routeMetadata.bulkAdd.title,
                },
                element: adminOnly(<BulkAddPage />),
            },
            { path: routeMetadata.bookLabels.path, handle: { title: routeMetadata.bookLabels.title }, element: adminOnly(<BookLabelsPage />) },
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
                element: adminOnly(<MarkReadPage />),
            },
            {
                path: routeMetadata.reading.path,
                handle: {
                    title: routeMetadata.reading.title,
                },
                element: adminOnly(<ReadingEditPage />),
            },
            {
                path: routeMetadata.editBook.path,
                handle: {
                    title: routeMetadata.editBook.title,
                },
                element: adminOnly(<EditBookPage />),
            },
            {
                path: routeMetadata.deleteBook.path,
                handle: {
                    title: routeMetadata.deleteBook.title,
                },
                element: adminOnly(<DeleteBookPage />),
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
                element: adminOnly(<LoansPage />),
            },
            { path: '/loans', element: <Navigate to={routeMetadata.loans.path} replace /> },
            { path: routeMetadata.albumLoans.path, handle: { title: routeMetadata.albumLoans.title }, element: adminOnly(<AlbumLoansPage />) },
            {
                path: routeMetadata.shelves.path,
                handle: {
                    title: routeMetadata.shelves.title,
                },
                element: adminOnly(<ShelvesPage />),
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
