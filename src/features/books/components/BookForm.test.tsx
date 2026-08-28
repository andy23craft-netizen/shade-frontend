import {
    useState,
} from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import type {
    AuthorRead,
    CategoryRead,
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

const TEST_CATEGORIES: CategoryRead[] = [
    {
        category_id: 'cat-fiction',
        name: 'Fiction',
        slug: 'fiction',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        category_id: 'cat-nonfiction',
        name: 'Nonfiction',
        slug: 'nonfiction',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
]

const TEST_AUTHORS: AuthorRead[] = [
    {
        author_id: 'author-fitzgerald',
        first_name: 'F. Scott',
        surname: 'Fitzgerald',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        author_id: 'author-herbert',
        first_name: 'Frank',
        surname: 'Herbert',
        created_date: '2026-01-01T00:00:00Z',
        updated_date: '2026-01-01T00:00:00Z',
    },
    {
        author_id: 'author-le-guin',
        first_name: 'Ursula K.',
        surname: 'Le Guin',
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
        authorIds: ['author-fitzgerald'],
        shelfId: 'id-a1',
        ...overrides,
    }
}

function ControlledBookForm({
                                initialValues = makeBook(),
                                shelves = TEST_SHELVES,
                                categories = TEST_CATEGORIES,
                                authors = TEST_AUTHORS,
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
            categories={categories}
            authors={authors}
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
            screen.getByRole('group', {
                name: 'Authors',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: /Select authors/,
            }),
        )

        expect(
            screen.getByLabelText('Frank Herbert'),
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
            screen.getByRole('group', {
                name: 'Categories',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: /Select categories/,
            }),
        )

        expect(
            screen.getByLabelText('Fiction'),
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

        const shelf = screen.getByLabelText('Shelf')

        fireEvent.click(shelf)

        expect(
            screen.getByRole('button', {
                name: 'Unknown',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'A1',
            }),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
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
                    categoryIds: ['cat-fiction'],
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
            screen.getByRole('button', {
                name: 'Remove F. Scott Fitzgerald author',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Select authors (1)',
            }),
        ).toBeInTheDocument()

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
            screen.getByRole('button', {
                name: 'Remove Fiction category',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Select categories (1)',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText('Shelf'),
        ).toHaveTextContent('A1')

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

    it('rejects an empty author selection', () => {
        const onSubmit = vi.fn()

        render(
            <ControlledBookForm
                initialValues={makeBook({
                    authorIds: [],
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
            'At least one author is required.',
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
        expect(bookFormDefaults.authorIds).toEqual([])
        expect(bookFormDefaults.categoryIds).toEqual(
            [],
        )
        expect(bookFormDefaults.shelfId).toBe('')
        expect(bookFormDefaults.tags).toBe('')
    })

    it('toggles categories through the category picker', () => {
        const onSubmit = vi.fn()

        render(
            <ControlledBookForm
                initialValues={makeBook({
                    categoryIds: [
                        'cat-fiction',
                    ],
                    shelfId: 'id-a1',
                })}
                onSubmit={onSubmit}
            />,
        )

        expect(
            screen.getByRole('button', {
                name: 'Remove Fiction category',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select categories (1)',
            }),
        )

        expect(
            screen.getByLabelText('Fiction'),
        ).toBeChecked()

        expect(
            screen.getByLabelText('Nonfiction'),
        ).not.toBeChecked()

        fireEvent.click(
            screen.getByLabelText('Fiction'),
        )

        fireEvent.click(
            screen.getByLabelText('Nonfiction'),
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                categoryIds: [
                    'cat-nonfiction',
                ],
            }),
        )
    })

    it('selects authors and preserves their selection order', () => {
        const onSubmit = vi.fn()

        render(
            <ControlledBookForm
                initialValues={makeBook({
                    authorIds: [],
                })}
                onSubmit={onSubmit}
            />,
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Select authors',
            }),
        )

        fireEvent.click(
            screen.getByLabelText('Ursula K. Le Guin'),
        )

        fireEvent.click(
            screen.getByLabelText('Frank Herbert'),
        )

        expect(
            screen.getByRole('button', {
                name: 'Remove Ursula K. Le Guin author',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Remove Frank Herbert author',
            }),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Save Book',
            }),
        )

        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                authorIds: [
                    'author-le-guin',
                    'author-herbert',
                ],
            }),
        )
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
