import type { BookFormValues } from './BookForm'

export const bookFormDefaults: BookFormValues = {
    title: '',
    authors: '',
    isbn13: '',
    publisher: '',
    publication_date: '',
    pages: '',
    category: 'unknown',
    shelf: 'unknown',
    status: 'available',
    is_read: false,
    tags: [],
    acquisition_source: '',
    purchase_date: '',
    purchase_price: '',
    notes: '',
}