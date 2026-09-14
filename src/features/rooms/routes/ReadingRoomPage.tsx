import { useState } from 'react'
import { AppLink } from '../../../components'
import { LibraryWordmark } from '../../../components/LibraryWordmark'
import readingLamp from '../../../assets/Reading_lamp.png'
import readingLampOff from '../../../assets/reading_lamp_off.png'
import { useAuth } from '../../auth/useAuth'

export function ReadingRoomPage() {
    const { isAdmin } = useAuth()
    const [isLampOn, setIsLampOn] = useState(true)
    return (
        <section className={`route-page room-landing room-landing--reading${isLampOn ? '' : ' room-landing--lamp-off'}`} aria-labelledby="reading-room-heading">
            <div className="room-landing__heading">
                <button
                    className="room-landing__header-art room-landing__header-art--reading room-landing__lamp-toggle"
                    type="button"
                    aria-pressed={isLampOn}
                    aria-label={`Turn reading lamp ${isLampOn ? 'off' : 'on'}`}
                    onClick={() => setIsLampOn((lampIsOn) => !lampIsOn)}
                >
                    <img className={isLampOn ? undefined : 'room-landing__lamp-image--off'} src={isLampOn ? readingLamp : readingLampOff} alt="" />
                </button>
                <div className="room-landing__heading-copy">
                    <LibraryWordmark className="room-landing__eyebrow" />
                    <h1 id="reading-room-heading" tabIndex={-1}>Reading Room</h1>
                    <p>Browse the shelves, tend the catalog, and revisit the reading record.</p>
                </div>
            </div>
            <nav className="room-landing__destinations" aria-label="Reading Room destinations">
                <AppLink to="/books"><strong>Browse the Stacks</strong><span>Find a book by title, author, or category.</span></AppLink>
                <AppLink to="/collections"><strong>Collections</strong><span>Visit the library's curated groupings.</span></AppLink>
                <AppLink to="/wishlists"><strong>Wishlists</strong><span>Keep track of books and albums to find.</span></AppLink>
                {isAdmin ? <><AppLink to="/reading-room/dashboard"><strong>Reading Dashboard</strong><span>See collection, circulation, and reading statistics.</span></AppLink>
                <AppLink to="/collection/manage"><strong>Manage</strong><span>Add books and organize the physical collection.</span></AppLink>
                <AppLink to="/reading-room/loans"><strong>Loans</strong><span>Review checked-out and returned books.</span></AppLink>
                </> : null}
            </nav>
        </section>
    )
}
