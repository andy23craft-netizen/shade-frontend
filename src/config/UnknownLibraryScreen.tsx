export interface UnknownLibraryScreenProps {
    hostname: string
}

export function UnknownLibraryScreen({
    hostname,
}: UnknownLibraryScreenProps) {
    return (
        <main className="unknown-library">
            <section className="unknown-library__card">
                <p className="unknown-library__wordmark">
                    Shade Library
                </p>
                <h1>Library not found</h1>
                <p>
                    This address is not assigned to a library.
                    Check the hostname and try again.
                </p>
                <p className="unknown-library__host">
                    Host: {hostname || 'unknown'}
                </p>
            </section>
        </main>
    )
}
