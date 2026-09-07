export const routeMetadata = {
  home: {
    path: '/',
    title: 'Home',
    heading: 'Shade Library',
  },
  about: {
    path: '/about',
    title: 'About',
    heading: 'Shade Library',
  },
  dashboard: {
    path: '/reading-room/dashboard',
    title: 'Dashboard',
    heading: 'Dashboard',
  },
  books: {
    path: '/books',
    title: 'Books',
    heading: 'Books',
  },
  albums: { path: '/albums', title: 'Albums', heading: 'Albums' },
  newAlbum: { path: '/albums/new', title: 'Add Album', heading: 'Add Album' },
  bulkAddAlbums: { path: '/albums/bulk-add', title: 'Album Bulk Add', heading: 'Album Bulk Add' },
  albumDetails: { path: '/albums/:albumId', title: 'Album Details', heading: 'Album Details' },
  editAlbum: { path: '/albums/:albumId/edit', title: 'Edit Album', heading: 'Edit Album' },
  stash: {
    path: '/stash',
    title: 'Stash',
    heading: 'Stash',
  },
  wishlists: {
    path: '/wishlists',
    title: 'Wishlists',
    heading: 'Wishlists',
  },
  collections: {
    path: '/collections',
    title: 'Collections',
    heading: 'Collections',
  },
  manageCollection: {
    path: '/collection/manage',
    title: 'Manage Collection',
    heading: 'Manage Collection',
  },
  librarySettings: {
    path: '/library/settings',
    title: 'Library Settings',
    heading: 'Library Settings',
  },
  newBook: {
    path: '/books/new',
    title: 'Add Book',
    heading: 'Add Book',
  },
  bulkAdd: {
    path: '/books/bulk-add',
    title: 'Bulk Add',
    heading: 'Bulk Add',
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
    path: '/reading-room/loans',
    title: 'Loans',
    heading: 'Loans',
  },
  readingRoom: {
    path: '/reading-room',
    title: 'Reading Room',
    heading: 'Reading Room',
  },
  listeningRoom: {
    path: '/listening-room',
    title: 'Listening Room',
    heading: 'Listening Room',
  },
  listeningDashboard: {
    path: '/listening-room/dashboard',
    title: 'Listening Dashboard',
    heading: 'Listening Dashboard',
  },
  albumLoans: {
    path: '/listening-room/loans',
    title: 'Album Loans',
    heading: 'Album Loans',
  },
  shelves: {
    path: '/shelves',
    title: 'Shelves',
    heading: 'Shelves',
  },
  notFound: {
    path: '*',
    title: 'Page Not Found',
    heading: 'Page Not Found',
  },
} as const
