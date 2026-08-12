import type { BookCreate } from '../../../api/apiTypes'

export const bookFormDefaults: BookCreate = {
    title: '',
    authors: '',
    category: 'unknown',
    shelf: 'unknown',
    status: 'available',
    is_read: false,
    acquisition_source: null,
    borrower: null,
    completion_date: null,
    datetime_loaned_out: null,
    isbn13: null,
    notes: null,
    pages: null,
    publication_date: null,
    publisher: null,
    purchase_date: null,
    purchase_price: null,
    rating: null,
    review: null,
    tags: null,
}