import { Link } from 'react-router-dom'
import { routeMetadata } from './routeMetadata'

export function NotFoundPage() {
    return (
        <>
            <h1 tabIndex={-1}>{routeMetadata.notFound.heading}</h1>

            <p>The requested page was not found.</p>

            <Link to="/">Return home</Link>
        </>
    )
}
