import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'
import { BackupLibraryPage } from '../features/books/routes/BackupLibraryPage'
import { BookDetailsPage } from '../features/books/routes/BookDetailsPage'
import { BooksPage } from '../features/books/routes/BooksPage'
import { DeletedBooksPage } from '../features/books/routes/DeletedBooksPage'
import { EditBookPage } from '../features/books/routes/EditBookPage'
import { MarkReadPage } from '../features/books/routes/MarkReadPage'
import { NewBookPage } from '../features/books/routes/NewBookPage'
import { CheckoutPage } from '../features/loans/routes/CheckoutPage'
import { CheckinPage } from '../features/loans/routes/CheckinPage'
import { LoansPage } from '../features/loans/routes/LoansPage'
import { ShelvesPage } from '../features/shelves/routes/ShelvesPage'
import { DashboardPage } from '../features/dashboard/routes/DashboardPage'
import { NotFoundPage } from './NotFoundPage'
import { routeMetadata } from './routeMetadata'
import { ReadingEditPage } from '../features/books/routes/ReadingEditPage'
import { DeleteBookPage } from '../features/books/routes/DeleteBookPage'
import { AboutPage } from '../features/about/routes/AboutPage'
import { ManageCollectionPage } from '../features/collection/routes/ManageCollectionPage'
import { WishlistsPage } from '../features/wishlists/routes/WishlistsPage'

export const routeConfig = [
    {
        element: <AppShell />,
        children: [
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
            {
                path: routeMetadata.wishlists.path,
                handle: {
                    title: routeMetadata.wishlists.title,
                },
                element: <WishlistsPage />,
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
                handle: {
                    title: routeMetadata.checkout.title,
                },
                element: <CheckoutPage />,
            },
            {
                path: routeMetadata.checkin.path,
                handle: {
                    title: routeMetadata.checkin.title,
                },
                element: <CheckinPage />,
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
                path: routeMetadata.deletedBooks.path,
                handle: {
                    title: routeMetadata.deletedBooks.title,
                },
                element: <DeletedBooksPage />,
            },
            {
                path: routeMetadata.backup.path,
                handle: {
                    title: routeMetadata.backup.title,
                },
                element: <BackupLibraryPage />,
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
