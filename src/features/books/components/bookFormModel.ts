import type {
    BookCreate,
} from '../../../api/apiTypes'
import type {
    BookFormValues,
} from './BookForm'

export function formValuesToBookCreate(
    values: BookFormValues,
): BookCreate {
    return {
        title: values.title.trim(),
        authors: values.authors.trim(),
        category: values.category,
        shelf: values.shelf,
        is_read: false,
        status: 'available',

        isbn13:
            values.isbn13.trim() === ''
                ? null
                : values.isbn13,

        publisher:
            values.publisher.trim() === ''
                ? null
                : values.publisher,

        publication_date:
            values.publication_date.trim() === ''
                ? null
                : values.publication_date,

        pages:
            values.pages.trim() === ''
                ? null
                : Number(values.pages),

        acquisition_source:
            values.acquisition_source.trim() === ''
                ? null
                : values.acquisition_source,

        purchase_date:
            values.purchase_date.trim() === ''
                ? null
                : values.purchase_date,

        purchase_price:
            values.purchase_price.trim() === ''
                ? null
                : Number(values.purchase_price),

        notes:
            values.notes.trim() === ''
                ? null
                : values.notes,

        tags:
            values.tags.length === 0
                ? null
                : values.tags,
    }
}
