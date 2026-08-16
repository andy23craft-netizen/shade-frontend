import {
    useState,
} from 'react'
import {
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    ShelfRead,
} from '../../../api/apiTypes'
import {
    BookForm,
    type BookFormProps,
    type BookFormValues,
} from './BookForm'
import { bookFormDefaults } from './bookFormDefaults'

const TEST_SHELVES: ShelfRead[] = [
    {
        shelf_id: 'id-unknown',
        common_name: 'unknown',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-a1',
        common_name: 'a1',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-liz',
        common_name: 'liz_tbr',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        shelf_id: 'id-removed',
        common_name: 'removed',
        location: null,
        description: null,
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

function makeBook(
    overrides: Partial<BookFormValues> = {},
): BookFormValues {
    return {
        ...bookFormDefaults,
        title: 'The Great Gatsby',
        authors: 'F. Scott Fitzgerald',
        shelfId: 'id-a1',
        ...overrides,
    }
}

function ControlledBookForm({
    initialValues = makeBook(),
    shelves = TEST_SHELVES,
    onSubmit = vi.fn(),
    onCancel = vi.fn(),
    ...rest
}: Partial<BookFormProps> & {
    initialValues?: BookFormValues
}) {
    const [
        values,
        setValues,
    ] = useState(initialValues)

    return (
        <BookForm
            values={values}
            shelves={shelves}
            onChange={setValues}
            onSubmit={onSubmit}
            onCancel={onCancel}
            {...rest}
        />
    )
}

describe('BookForm', () => {
    it('renders the main book fields without status or read controls', () => {
        render(
            <ControlledBookForm
                initialValues={bookFormDefaults}
            />,
        )

        expect(
            screen.getByLabelText('Title'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Authors'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('ISBN'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Publisher'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(
                'Publication date',
            ),
        ).toHaveAttribute(
            'type',
            'text',
        )

        expect(
            screen.getByLabelText('Pages'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Category'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Shelf'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Tags'),
        ).toBeInTheDocument()

        expect(
            screen.queryByLabelText('Status'),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByLabelText('Read'),
        ).not.toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        ).toBeInTheDocument()
    })

    it('shows Title Case shelf labels and excludes removed from create options', () => {
        render(
            <ControlledBookForm
                initialValues={bookFormDefaults}
            />,
        )

        const shelf = screen.getByLabelText(
            'Shelf',
        )

        expect(
            within(shelf).getByRole('option', {
                name: 'Unknown',
            }),
        ).toBeInTheDocument()

        expect(
            within(shelf).getByRole('option', {
                name: 'Liz Tbr',
            }),
        ).toBeInTheDocument()

        expect(
            within(shelf).queryByRole('option', {
                name: 'Removed',
            }),
        ).not.toBeInTheDocument()
    })

    it('uses the supplied values', () => {
        render(
            <ControlledBookForm
                initialValues={makeBook({
                    isbn13: '9780743273565',
                    publisher: 'Scribner',
                    pages: '180',
                    category: 'fiction',
                    shelfId: 'id-a1',
                    notes: 'A classic.',
                    tags: 'classic, american',
                })}
            />,
        )

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue('The Great Gatsby')

        expect(
            screen.getByLabelText('Authors'),
        ).toHaveValue('F. Scott Fitzgerald')

        expect(
            screen.getByLabelText('ISBN'),
        ).toHaveValue('9780743273565')

        expect(
            screen.getByLabelText('Publisher'),
        ).toHaveValue('Scribner')

        expect(
            screen.getByLabelText('Pages'),
        ).toHaveValue(180)

        expect(
            screen.getByLabelText('Category'),
        ).toHaveValue('fiction')

        expect(
            screen.getByLabelText('Shelf'),
        ).toHaveValue('id-a1')

        expect(
            screen.getByLabelText('Notes'),
        ).toHaveValue('A classic.')

        expect(
            screen.getByLabelText('Tags'),
        ).toHaveValue(
            'classic, american',
        )
    })

    it('rejects an empty title with a field and summary error', () => {
        const onSubmit = vi.fn()

        render(
            <ControlledBookForm
                initialValues={makeBook({
                    title: '',
                })}
                onSubmit={onSubmit}
            />,
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Title is required.',
        )

        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('rejects a missing shelf selection', () => {
        const onSubmit = vi.fn()

        render(
            <ControlledBookForm
                initialValues={makeBook({
                    shelfId: '',
                })}
                onSubmit={onSubmit}
            />,
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Shelf is required.',
        )

        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('rejects empty authors', () => {
        const onSubmit = vi.fn()

        render(
            <ControlledBookForm
                initialValues={makeBook({
                    authors: '',
                })}
                onSubmit={onSubmit}
            />,
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Authors are required.',
        )

        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('rejects invalid ISBN check digits before submit', () => {
        const onSubmit = vi.fn()

        render(
            <ControlledBookForm
                initialValues={makeBook({
                    isbn13: '0441172718',
                })}
                onSubmit={onSubmit}
            />,
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Enter a valid ISBN-10 or ISBN-13.',
        )

        expect(onSubmit).not.toHaveBeenCalled()
    })

    it('submits the validated form values', () => {
        const onSubmit = vi.fn()

        render(
            <ControlledBookForm
                initialValues={bookFormDefaults}
                onSubmit={onSubmit}
            />,
        )

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: 'Dune',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: 'Frank Herbert',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('ISBN'),
            {
                target: {
                    value: '978-0-441-17271-9',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Category'),
            {
                target: {
                    value: 'fiction',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Shelf'),
            {
                target: {
                    value: 'id-a1',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Pages'),
            {
                target: {
                    value: '412',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText(
                'Publication date',
            ),
            {
                target: {
                    value: '1965',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText(
                'Purchase price',
            ),
            {
                target: {
                    value: '12.50',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(onSubmit).toHaveBeenCalledOnce()

        expect(onSubmit).toHaveBeenCalledWith({
            title: 'Dune',
            authors: 'Frank Herbert',
            isbn13: '978-0-441-17271-9',
            publisher: '',
            publication_date: '1965',
            pages: '412',
            category: 'fiction',
            shelfId: 'id-a1',
            tags: '',
            acquisition_source: '',
            purchase_date: '',
            purchase_price: '12.50',
            notes: '',
        })
    })

    it('submits the current form values after validation', () => {
        const onSubmit = vi.fn()

        render(
            <ControlledBookForm
                initialValues={makeBook({
                    shelfId: 'id-unknown',
                })}
                onSubmit={onSubmit}
            />,
        )

        fireEvent.change(
            screen.getByLabelText('Title'),
            {
                target: {
                    value: '  Dune  ',
                },
            },
        )

        fireEvent.change(
            screen.getByLabelText('Authors'),
            {
                target: {
                    value: '  Frank Herbert  ',
                },
            },
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                title: '  Dune  ',
                authors: '  Frank Herbert  ',
                shelfId: 'id-unknown',
                pages: '',
                purchase_price: '',
            }),
        )
    })

    it('calls onCancel when Cancel is clicked', () => {
        const onCancel = vi.fn()

        render(
            <ControlledBookForm
                onCancel={onCancel}
            />,
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(onCancel).toHaveBeenCalledOnce()
    })

    it('disables both buttons while submitting', () => {
        render(
            <ControlledBookForm
                isSubmitting
            />,
        )

        expect(
            screen.getByRole('button', {
                name: 'Saving…',
            }),
        ).toBeDisabled()

        expect(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        ).toBeDisabled()
    })

    it('starts a new book with the expected defaults', () => {
        expect(bookFormDefaults.title).toBe('')
        expect(bookFormDefaults.authors).toBe('')
        expect(bookFormDefaults.category).toBe(
            'unknown',
        )
        expect(bookFormDefaults.shelfId).toBe('')
        expect(bookFormDefaults.tags).toBe('')
    })

    it('shows linked server field errors in the summary', () => {
        render(
            <ControlledBookForm
                serverFieldErrors={{
                    title:
                        'Server rejected title.',
                }}
                formError="Could not create the book."
            />,
        )

        const summary = screen.getByRole(
            'alert',
        )

        expect(summary).toHaveTextContent(
            'Could not create the book.',
        )
        expect(summary).toHaveTextContent(
            'Server rejected title.',
        )

        expect(
            screen.getByRole('link', {
                name: /Title: Server rejected title\./,
            }),
        ).toHaveAttribute(
            'href',
            expect.stringContaining('-title'),
        )
    })
})
