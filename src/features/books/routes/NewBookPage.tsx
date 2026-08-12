import { useNavigate } from 'react-router-dom'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { BookForm } from '../components/BookForm'
import { useCreateBook } from '../../../api/booksQueries'
import { bookFormDefaults } from '../components/bookFormDefaults'
import type { BookCreate } from '../../../api/apiTypes'

export function NewBookPage() {
    const navigate = useNavigate()
    const createBook = useCreateBook()

    function handleSubmit(
        values: BookCreate,
    ) {
        createBook.mutate(values, {
            onSuccess: (createdBook) => {
                void navigate(
                    `/books/${createdBook.id}`,
                )
            },
        })
    }

    return (
        <section className="route-page">
            <AppLink to="/books">
                ← Back to Books
            </AppLink>

            <header>
                <h1 tabIndex={-1}>Add Book</h1>

                <p>
                    Add a new book to the library.
                </p>
            </header>

            {createBook.isError ? (
                <Alert
                    variant="error"
                    title="Unable to add book"
                >
                    {createBook.error instanceof Error
                        ? createBook.error.message
                        : 'An unexpected error occurred.'}
                </Alert>
            ) : null}

            <BookForm
                initialValues={bookFormDefaults}
                onSubmit={handleSubmit}
                onCancel={() =>
                    void navigate('/books')
                }
                isSubmitting={
                    createBook.isPending
                }
            />
        </section>
    )
}