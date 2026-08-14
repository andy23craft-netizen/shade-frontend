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
import { DashboardPage } from '../features/dashboard/routes/DashboardPage'
import { NotFoundPage } from './NotFoundPage'
import { routeMetadata } from './routeMetadata'
import { ReadingEditPage } from '../features/books/routes/ReadingEditPage'


export const routeConfig = [
    {
        element: <AppShell />,
        children: [
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
