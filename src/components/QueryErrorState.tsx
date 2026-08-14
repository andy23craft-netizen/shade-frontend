import { Alert } from './Alert'
import { Button } from './Button'
import {
    formatApiQueryError,
    isUnauthorizedQueryError,
} from '../api/apiErrors'

interface QueryErrorStateProps {
    title: string
    error: unknown
    onRetry?: () => void
}

const UNAUTHORIZED_HELP =
    'Check that VITE_API_SECRET_KEY in your .env file matches the backend API_SECRET_KEY, then restart the dev server or rebuild.'

export function QueryErrorState({
    title,
    error,
    onRetry,
}: QueryErrorStateProps) {
    const message = formatApiQueryError(error)
    const isUnauthorized =
        isUnauthorizedQueryError(error)
    const showRetry =
        onRetry !== undefined && !isUnauthorized

    return (
        <>
            <Alert variant="error" title={title}>
                {message}
                {isUnauthorized ? (
                    <>
                        {' '}
                        {UNAUTHORIZED_HELP}
                    </>
                ) : null}
            </Alert>

            {showRetry ? (
                <Button
                    type="button"
                    onClick={onRetry}
                >
                    Retry
                </Button>
            ) : null}
        </>
    )
}
