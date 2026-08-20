export const routeMetadata = {
  about: {
    path: '/',
    title: 'Shade Library',
    heading: 'Shade Library',
  },
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    heading: 'Dashboard',
  },
  books: {
    path: '/books',
    title: 'Books',
    heading: 'Books',
  },
  wishlists: {
    path: '/wishlists',
    title: 'Wishlists',
    heading: 'Wishlists',
  },
  manageCollection: {
    path: '/collection/manage',
    title: 'Manage Collection',
    heading: 'Manage Collection',
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
  markRead: {
    path: '/books/:bookId/mark-read',
    title: 'Mark Book Read',
    heading: 'Mark Book Read',
  },
  reading: {
    path: '/books/:bookId/reading',
    title: 'Edit Reading',
    heading: 'Edit Reading',
  },
  editBook: {
    path: '/books/:bookId/edit',
    title: 'Edit Book',
    heading: 'Edit Book',
  },
  deleteBook: {
    path: '/books/:bookId/delete',
    title: 'Delete Book',
    heading: 'Delete Book',
  },
  checkout: {
    path: '/checkout',
  },
  checkin: {
    path: '/checkin',
  },
  loans: {
    path: '/loans',
    title: 'Loans',
    heading: 'Loans',
  },
  shelves: {
    path: '/shelves',
    title: 'Shelves',
    heading: 'Shelves',
  },
  deletedBooks: {
    path: '/admin/deleted',
    title: 'Deleted Books',
    heading: 'Deleted Books',
  },
  notFound: {
    path: '*',
    title: 'Page Not Found',
    heading: 'Page Not Found',
  },
} as const
