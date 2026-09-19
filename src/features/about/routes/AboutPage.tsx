import { CatalogGuide } from '../components/CatalogGuide'
import { resolveLibraryContext } from '../../../config/libraryContext'
import { getLibraryIdentity } from '../../../config/libraryIdentity'

export function AboutPage() {
    const context = resolveLibraryContext(window.location.hostname)
    const identity = getLibraryIdentity(context?.id)

    return (
        <section className="route-page about-page">
            <div className="about-page__intro">
                <h1 tabIndex={-1}>
                    {identity.wordmark}
                </h1>

                <p className="about-page__lede">
                    {identity.tagline ?? 'A home collection, made easier to explore.'}
                </p>

                <p>
                    Browse books and albums, find where they live, and keep track of
                    reading, listening, and loans in one shared catalog.
                </p>
            </div>

            <section
                className="about-page__section"
                aria-labelledby="about-lending-policy"
            >
                <h2 id="about-lending-policy">
                    Lending Policy
                </h2>

                <p>
                    <strong>Books are meant to be read.</strong>
                </p>

                <p>
                    If you find something you want to read, borrow it. Take your time
                    with it and bring it back at your leisure. What matters is that the
                    book is enjoyed and eventually finds its way home.
                </p>

                <p>
                    If something happens to it—or if a book simply goes missing—just let
                    me know. Accidents happen.
                </p>

                <p>
                    A handful of books aren&apos;t available to borrow because of their age,
                    condition, or because they&apos;re special editions. Those will be marked
                    as you browse. Everything else is here to be read.
                </p>
            </section>

            <CatalogGuide />

        </section>
    )
}
