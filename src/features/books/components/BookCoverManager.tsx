import {
    useRef,
    useState,
} from 'react'

import {
    useRemoveBookCover,
    useUploadBookCover,
} from '../../../api/booksQueries'
import {
    Alert,
    Button,
} from '../../../components'
import {
    isApiError,
} from '../../../api/apiErrors'

interface BookCoverManagerProps {
    bookId: string
}

function coverErrorMessage(
    error: unknown,
    fallback: string,
): string {
    if (isApiError(error)) {
        return (
            error.detail ??
            error.message ??
            fallback
        )
    }

    if (error instanceof Error) {
        return error.message
    }

    return fallback
}

export function BookCoverManager({
                                     bookId,
                                 }: BookCoverManagerProps) {
    const inputRef =
        useRef<HTMLInputElement | null>(null)

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null)

    const uploadCover =
        useUploadBookCover()

    const removeCover =
        useRemoveBookCover()

    const isPending =
        uploadCover.isPending ||
        removeCover.isPending

    function chooseCover() {
        inputRef.current?.click()
    }

    function handleFile(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0]

        if (!file) {
            return
        }

        setErrorMessage(null)

        uploadCover.mutate(
            {
                id: bookId,
                file,
            },
            {
                onError: (error) => {
                    setErrorMessage(
                        coverErrorMessage(
                            error,
                            'The cover could not be uploaded.',
                        ),
                    )
                },
            },
        )

        event.target.value = ''
    }

    function handleRemove() {
        setErrorMessage(null)

        removeCover.mutate(
            bookId,
            {
                onError: (error) => {
                    setErrorMessage(
                        coverErrorMessage(
                            error,
                            'The custom cover could not be removed.',
                        ),
                    )
                },
            },
        )
    }

    return (
        <div className="book-cover-manager">
            <input
                ref={inputRef}
                className="book-cover-manager__input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose book cover image"
                onChange={handleFile}
            />

            <div className="book-cover-manager__actions">
                <Button
                    type="button"
                    variant="secondary"
                    disabled={isPending}
                    onClick={chooseCover}
                >
                    {uploadCover.isPending
                        ? 'Uploading…'
                        : 'Upload / Replace Cover'}
                </Button>

                <Button
                    type="button"
                    variant="secondary"
                    disabled={isPending}
                    onClick={handleRemove}
                >
                    {removeCover.isPending
                        ? 'Removing…'
                        : 'Remove Custom Cover'}
                </Button>
            </div>

            {errorMessage ? (
                <Alert
                    variant="error"
                    title="Unable to update cover"
                >
                    {errorMessage}
                </Alert>
            ) : null}
        </div>
    )
}
