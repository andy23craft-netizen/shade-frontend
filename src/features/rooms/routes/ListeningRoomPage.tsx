import { AppLink } from '../../../components'
import { LibraryWordmark } from '../../../components/LibraryWordmark'

export function ListeningRoomPage() {
    return (
        <section className="route-page room-landing room-landing--listening" aria-labelledby="listening-room-heading">
            <div className="room-landing__heading">
                <LibraryWordmark className="room-landing__eyebrow" />
                <h1 id="listening-room-heading" tabIndex={-1}>Listening Room</h1>
                <p>Flip through the bins, see what is in rotation, and keep the collection spinning.</p>
            </div>
            <nav className="room-landing__destinations" aria-label="Listening Room destinations">
                <AppLink to="/albums"><strong>Browse the Bins</strong><span>Dig through releases by artist, title, and format.</span></AppLink>
                <AppLink to="/listening-room/dashboard"><strong>Listening Dashboard</strong><span>See collection, circulation, and listening statistics.</span></AppLink>
                <AppLink to="/albums/new"><strong>Add Album</strong><span>File a new release in the collection.</span></AppLink>
                <AppLink to="/albums/bulk-add"><strong>Bulk Add</strong><span>Bring a stack of releases into the catalog.</span></AppLink>
                <AppLink to="/listening-room/loans"><strong>Loans</strong><span>Review albums out on loan and returned.</span></AppLink>
                <AppLink to="/collection/manage"><strong>Manage</strong><span>Maintain both sides of the collection.</span></AppLink>
                <AppLink to="/collections"><strong>Collections</strong><span>Visit the library's curated groupings.</span></AppLink>
                <AppLink to="/wishlists"><strong>Wishlists</strong><span>Check the shared want lists.</span></AppLink>
            </nav>
        </section>
    )
}
