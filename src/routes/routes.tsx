import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'
import { BackupLibraryPage } from '../features/books/routes/BackupLibraryPage'
import { DeletedBooksPage } from '../features/books/routes/DeletedBooksPage'
import { EditBookPage } from '../features/books/routes/EditBookPage'
import { CheckoutPage } from '../features/loans/routes/CheckoutPage'
import { CheckinPage } from '../features/loans/routes/CheckinPage'
import { ConnectionPage } from '../features/settings/routes/ConnectionPage'
import { NotFoundPage } from './NotFoundPage'
import { routeMetadata } from './routeMetadata'
import { RoutePlaceholder } from './RoutePlaceholder'

export const routeConfig = [
    {
        element: <AppShell />,
        children: [
            {
                path: routeMetadata.dashboard.path,
                handle: {
                    title: routeMetadata.dashboard.title,
                },
                element: (
                    <RoutePlaceholder
                        heading={routeMetadata.dashboard.heading}
                    />
                ),
            },
            {
                path: routeMetadata.books.path,
                handle: {
                    title: routeMetadata.books.title,
                },
                element: (
                    <RoutePlaceholder
                        heading={routeMetadata.books.heading}
                    />
                ),
            },
            {
                path: routeMetadata.newBook.path,
                handle: {
                    title: routeMetadata.newBook.title,
                },
                element: (
                    <RoutePlaceholder
                        heading={routeMetadata.newBook.heading}
                    />
                ),
            },
            {
                path: routeMetadata.bookDetails.path,
                handle: {
                    title: routeMetadata.bookDetails.title,
                },
                element: (
                    <RoutePlaceholder
                        heading={routeMetadata.bookDetails.heading}
                    />
                ),
            },
            {
                path: routeMetadata.editBook.path,
                handle: {
                    title: routeMetadata.editBook.title,
                },
                element: <EditBookPage />,
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
                element: (
                    <RoutePlaceholder
                        heading={routeMetadata.loans.heading}
                    />
                ),
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
                path: routeMetadata.connection.path,
                handle: {
                    title: routeMetadata.connection.title,
                },
                element: <ConnectionPage />,
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