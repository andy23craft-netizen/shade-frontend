export const routeMetadata = {
  dashboard: {
    path: '/',
    title: 'Dashboard',
    heading: 'Dashboard',
  },
  books: {
    path: '/books',
    title: 'Books',
    heading: 'Books',
  },
  bookDetails: {
    path: '/books/:bookId',
    title: 'Book',
    heading: 'Book',
  },
  newBook: {
    path: '/books/new',
    title: 'Add Book',
    heading: 'Add Book',
  },
  loans: {
    path: '/loans',
    title: 'Loans',
    heading: 'Loans',
  },
  notFound: {
    path: '*',
    title: 'Page Not Found',
    heading: 'Page Not Found',
  },
} as const
