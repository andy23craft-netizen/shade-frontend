import type { BookFormValues } from './BookForm'

export const bookFormDefaults: BookFormValues = {
    title: '',
    authorIds: [],
    editorIds: [],
    illustratorIds: [],
    translatorIds: [],
    isbn13: '',
    isbnNotApplicable: false,
    publisher: '',
    publication_date: '',
    pages: '',
    categoryIds: [],
    shelfId: '',
    tags: '',
    acquisition_source: '',
    purchase_date: '',
    purchase_price: '',
    notes: '',
}
