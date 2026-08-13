import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BookForm } from './BookForm'
import { bookFormDefaults } from './bookFormDefaults'
import type { BookFormValues } from './BookForm'
function makeBook(
    overrides: Partial<BookFormValues> = {},
): BookFormValues {
    return {
        ...bookFormDefaults,
        title: 'The Great Gatsby',
        authors: 'F. Scott Fitzgerald',
        ...overrides,
    }
}

describe('BookForm', () => {
    it('renders the main book fields', () => {
        render(
            <BookForm
                initialValues={bookFormDefaults}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        expect(
            screen.getByLabelText('Title'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Authors'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('ISBN-13'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Publisher'),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(
                'Publication date',
            ),
        ).toBeInTheDocument()

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
            screen.getByLabelText('Status'),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        ).toBeInTheDocument()
    })

    it('uses the supplied initial values', () => {
        const book = makeBook({
            isbn13: '9780743273565',
            publisher: 'Scribner',
            pages: '180',
            category: 'fiction',
            shelf: 'a1',
            status: 'available',
            is_read: true,
            notes: 'A classic.',
            tags: ['classic', 'american'],
        })

        render(
            <BookForm
                initialValues={book}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        expect(
            screen.getByLabelText('Title'),
        ).toHaveValue('The Great Gatsby')

        expect(
            screen.getByLabelText('Authors'),
        ).toHaveValue('F. Scott Fitzgerald')

        expect(
            screen.getByLabelText('ISBN-13'),
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
        ).toHaveValue('a1')

        expect(
            screen.getByLabelText('Status'),
        ).toHaveValue('available')

        expect(
            screen.getByLabelText('Read'),
        ).toBeChecked()

        expect(
            screen.getByLabelText('Notes'),
        ).toHaveValue('A classic.')

        expect(
            screen.getByLabelText('Tags'),
        ).toHaveValue(
            'classic, american',
        )
    })

    it('rejects an empty title', () => {
        const onSubmit = vi.fn()

        render(
            <BookForm
                initialValues={makeBook({
                    title: '',
                })}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
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

    it('rejects empty authors', () => {
        const onSubmit = vi.fn()

        render(
            <BookForm
                initialValues={makeBook({
                    authors: '',
                })}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
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

    it('submits the edited values', async () => {
        const onSubmit = vi.fn()

        render(
            <BookForm
                initialValues={bookFormDefaults}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
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
            screen.getByLabelText('ISBN-13'),
            {
                target: {
                    value: '9780441172719',
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
                    value: 'a1',
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

        fireEvent.click(
            screen.getByLabelText('Read'),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(onSubmit).toHaveBeenCalledOnce()

        expect(onSubmit).toHaveBeenCalledWith({
            ...bookFormDefaults,
            title: 'Dune',
            authors: 'Frank Herbert',
            isbn13: '9780441172719',
            category: 'fiction',
            shelf: 'a1',
            pages: 412,
            purchase_price: null,
            is_read: true,
        })
    })

    it('trims title and authors before submitting', () => {
        const onSubmit = vi.fn()

        render(
            <BookForm
                initialValues={bookFormDefaults}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
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

        expect(onSubmit).toHaveBeenCalledWith({
            ...bookFormDefaults,
            title: 'Dune',
            authors: 'Frank Herbert',
            pages: null,
            purchase_price: null,
        })
    })

    it('calls onCancel when Cancel is clicked', () => {
        const onCancel = vi.fn()

        render(
            <BookForm
                initialValues={bookFormDefaults}
                onSubmit={vi.fn()}
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
            <BookForm
                initialValues={bookFormDefaults}
                onSubmit={vi.fn()}
                onCancel={vi.fn()}
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
        expect(bookFormDefaults.shelf).toBe(
            'unknown',
        )
        expect(bookFormDefaults.status).toBe(
            'available',
        )
        expect(bookFormDefaults.is_read).toBe(false)
    })
})
