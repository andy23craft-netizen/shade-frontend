import { CatalogGuide } from '../components/CatalogGuide'

export function AboutPage() {
    return (
        <section className="route-page about-page">
            <div className="about-page__intro">
                <h1 tabIndex={-1}>
                    Shade Library
                </h1>

                <p className="about-page__lede">
                    My home library, made easier to explore.
                </p>

                <p>
                    I love books. Big books, little books, old books, new books—the point
                    of having them, to me, is that they should be read.
                </p>

                <p>
                    Over the years, though, the collection got large enough that it
                    became difficult to navigate. Friends would stop at the shelves when
                    they came over and start looking through the titles, but there were
                    simply too many to take in at once. I could explain how everything
                    was organized, but then we were spending time talking about the
                    shelves instead of the books.
                </p>

                <p>
                    And everybody looks for something different. Some people want
                    thrillers. Some want fantasy. Some want history, philosophy, poetry,
                    or something they would never have thought to pick up on their own.
                </p>

                <p>
                    Shade Library grew out of that problem. It gives you a way to browse
                    the collection on your own terms, while giving me a way to remember
                    where everything is—what I own, where it lives, whether I&apos;ve read
                    it, and whether somebody has borrowed it.
                </p>

                <p>
                    The shelves are still there. This just makes them a little easier to
                    wander through.
                </p>
            </div>

            <section
                className="about-page__section"
                aria-labelledby="about-charles-leewright"
            >
                <h2 id="about-charles-leewright">
                    For Charles Leewright
                </h2>

                <p>
                    Many of the books in this library belonged to my grandfather,
                    <strong> Charles Leewright</strong>, who died in 2019.
                </p>

                <p>
                    He shared his love of books and writing with me, and a part of this
                    collection exists because of him. Shade Library is dedicated to his
                    memory.
                </p>
            </section>

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
