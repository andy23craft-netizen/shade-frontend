import { AppLink } from '../../../components'
import { LibraryWordmark } from '../../../components/LibraryWordmark'

export function ReadingRoomPage() {
    return (
        <section className="route-page room-landing room-landing--reading" aria-labelledby="reading-room-heading">
            <div className="room-landing__heading">
                <LibraryWordmark className="room-landing__eyebrow" />
                <h1 id="reading-room-heading" tabIndex={-1}>Reading Room</h1>
                <p>Browse the shelves, tend the catalog, and revisit the reading record.</p>
            </div>
            <nav className="room-landing__destinations" aria-label="Reading Room destinations">
                <AppLink to="/books"><strong>Browse the Stacks</strong><span>Find a book by title, author, or category.</span></AppLink>
                <AppLink to="/reading-room/dashboard"><strong>Reading Dashboard</strong><span>See collection, circulation, and reading statistics.</span></AppLink>
                <AppLink to="/collection/manage"><strong>Manage</strong><span>Add books and organize the physical collection.</span></AppLink>
                <AppLink to="/reading-room/loans"><strong>Loans</strong><span>Review checked-out and returned books.</span></AppLink>
                <AppLink to="/collections"><strong>Collections</strong><span>Visit the library's curated groupings.</span></AppLink>
                <AppLink to="/wishlists"><strong>Wishlists</strong><span>Keep track of books and albums to find.</span></AppLink>
            </nav>
        </section>
    )
}
