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
  newBook: {
    path: '/books/new',
    title: 'Add Book',
    heading: 'Add Book',
  },
  bookDetails: {
    path: '/books/:bookId',
    title: 'Book Details',
    heading: 'Book Details',
  },
  editBook: {
    path: '/books/:bookId/edit',
    title: 'Edit Book',
    heading: 'Edit Book',
  },
  checkout: {
    path: '/checkout',
    title: 'Check Out',
    heading: 'Check Out',
  },
  checkin: {
    path: '/books/:bookId/checkin',
    title: 'Check In',
    heading: 'Check In',
  },
  loans: {
    path: '/loans',
    title: 'Loans',
    heading: 'Loans',
  },
  deletedBooks: {
    path: '/admin/deleted',
    title: 'Deleted Books',
    heading: 'Deleted Books',
  },
  backup: {
    path: '/admin/backup',
    title: 'Backup Library',
    heading: 'Backup Library',
  },
  connection: {
    path: '/settings/connection',
    title: 'Connection Settings',
    heading: 'Connection Settings',
  },
  notFound: {
    path: '*',
    title: 'Page Not Found',
    heading: 'Page Not Found',
  },
} as const
