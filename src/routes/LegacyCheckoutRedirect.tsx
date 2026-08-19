import {
    Navigate,
    useLocation,
} from 'react-router-dom'

import { routeMetadata } from './routeMetadata'

export function LegacyCheckoutRedirect() {
    const location = useLocation()
    const searchParams =
        new URLSearchParams(location.search)

    const bookId = searchParams.get('bookId')

    if (bookId) {
        return (
            <Navigate
                to={{
                    pathname: `/books/${bookId}`,
                    search: '?checkout=1',
                }}
                replace
            />
        )
    }

    return (
        <Navigate
            to={{
                pathname: routeMetadata.books.path,
            }}
            replace
        />
    )
}
