import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AppLink, Button, Field, LoadingState, QueryErrorState } from '../../../components'
import { useLibrarySetup } from '../../../api/libraryQueries'
import { useCreateShelf, useShelves } from '../../../api/shelvesQueries'
import type { ShelfRead } from '../../../api/apiTypes'
import { canDeleteShelf, formatShelfCommonNameForDisplay } from '../../shelves/shelfDisplay'
import {
    createGuidedSetupSession,
    guidedSetupStorageKey,
    loadGuidedSetupSession,
    saveGuidedSetupSession,
    selectGuidedSetupMedia,
    setGuidedSetupDestination,
    type GuidedSetupSession,
    type GuidedSetupMedia,
} from '../guidedSetupSession'

export function LibrarySetupPage() {
    const setup = useLibrarySetup()

    if (setup.isPending) {
        return (
            <section className="route-page library-setup-page">
                <h1 tabIndex={-1}>Library Setup</h1>
                <LoadingState label="Checking library setup…" />
            </section>
        )
    }

    if (setup.isError) {
        return (
            <section className="route-page library-setup-page">
                <h1 tabIndex={-1}>Library Setup</h1>
                <QueryErrorState
                    title="Unable to check library setup"
                    error={setup.error}
                    onRetry={() => void setup.refetch()}
                />
            </section>
        )
    }

    if (setup.data.state === 'failed') {
        return (
            <section className="route-page library-setup-page">
                <header>
                    <p className="page-eyebrow">Setup needs attention</p>
                    <h1 tabIndex={-1}>Library Setup</h1>
                    <p>
                        The library could not finish preparing its required locations.
                        No setup choices or catalog items were discarded.
                    </p>
                </header>
                <p role="alert">
                    Setup cannot continue until the library service recovers.
                </p>
                <button type="button" className="button button--primary" onClick={() => void setup.refetch()}>
                    Check again
                </button>
            </section>
        )
    }

    if (setup.data.state === 'complete') {
        return (
            <section className="route-page library-setup-page">
                <header>
                    <p className="page-eyebrow">Setup complete</p>
                    <h1 tabIndex={-1}>Your library is ready</h1>
                    <p>Guided building remains available whenever you add another shelf or crate.</p>
                </header>
                <nav className="form-actions" aria-label="Continue from setup">
                    <AppLink className="button button--primary" to="/collection/manage">
                        Manage Collection
                    </AppLink>
                    <AppLink className="button button--secondary" to="/reading-room/dashboard">
                        Reading Dashboard
                    </AppLink>
                    <AppLink className="button button--secondary" to="/listening-room/dashboard">
                        Listening Dashboard
                    </AppLink>
                </nav>
            </section>
        )
    }

    const continuing = setup.data.state === 'in_progress'
    const supportsBooks = setup.data.supported_media.includes('book')
    const supportsAlbums = setup.data.supported_media.includes('album')

    return (
        <section className="route-page library-setup-page">
            <header>
                <p className="page-eyebrow">{continuing ? 'Setup in progress' : 'Welcome'}</p>
                <h1 tabIndex={-1}>{continuing ? 'Continue building your library' : 'Set up your library'}</h1>
                <p>
                    Choose what you are organizing first. Books are built shelf by shelf;
                    albums are built crate by crate.
                </p>
            </header>
            <SetupBuilder supportedMedia={[
                ...(supportsBooks ? ['book' as const] : []),
                ...(supportsAlbums ? ['album' as const] : []),
            ]} />
        </section>
    )
}

function SetupBuilder({ supportedMedia }: { supportedMedia: GuidedSetupMedia[] }) {
    const navigate = useNavigate()
    const storageKey = guidedSetupStorageKey(window.location.hostname)
    const [session, setSession] = useState<GuidedSetupSession>(() =>
        loadGuidedSetupSession(window.localStorage, storageKey) ?? createGuidedSetupSession(),
    )
    const initialMedia = session.selectedMedia && supportedMedia.includes(session.selectedMedia)
        ? session.selectedMedia
        : null
    const [media, setMedia] = useState<GuidedSetupMedia | null>(initialMedia)
    const [shelfId, setShelfId] = useState(
        initialMedia ? session.destinations[initialMedia]?.shelfId ?? '' : '',
    )
    const [newLocationName, setNewLocationName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const shelves = useShelves({ enabled: media !== null })
    const createShelf = useCreateShelf()

    function persist(next: GuidedSetupSession) {
        setSession(next)
        saveGuidedSetupSession(window.localStorage, storageKey, next)
    }

    function chooseMedia(nextMedia: GuidedSetupMedia) {
        setMedia(nextMedia)
        setShelfId(session.destinations[nextMedia]?.shelfId ?? '')
        setError(null)
        persist(selectGuidedSetupMedia(session, nextMedia))
    }

    async function continueToIntake(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!media) return
        setError(null)
        let destination: Pick<ShelfRead, 'shelf_id' | 'common_name'> | undefined

        try {
            if (newLocationName.trim()) {
                destination = await createShelf.mutateAsync({ common_name: newLocationName.trim() })
            } else {
                destination = (shelves.data ?? []).find((shelf) => shelf.shelf_id === shelfId)
            }
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'The location could not be created.')
            return
        }

        if (!destination) {
            setError(`Choose or create a ${media === 'book' ? 'shelf' : 'crate'} first.`)
            return
        }

        const next = setGuidedSetupDestination(session, media, {
            shelfId: destination.shelf_id,
            shelfName: destination.common_name,
        })
        persist(next)
        const pathname = media === 'book' ? '/books/bulk-add' : '/albums/bulk-add'
        const params = new URLSearchParams({ setup: '1', shelf_name: destination.common_name })
        navigate(`${pathname}?${params.toString()}`)
    }

    if (!media) {
        return (
            <div className="manage-collection-page__actions" role="group" aria-label="Choose a collection to build">
                {supportedMedia.includes('book') ? (
                    <Button type="button" className="manage-collection-action" onClick={() => chooseMedia('book')}>
                        Books — build a shelf
                    </Button>
                ) : null}
                {supportedMedia.includes('album') ? (
                    <Button type="button" className="manage-collection-action" onClick={() => chooseMedia('album')}>
                        Albums — build a crate
                    </Button>
                ) : null}
            </div>
        )
    }

    const locationLabel = media === 'book' ? 'shelf' : 'crate'
    const assignableShelves = (shelves.data ?? []).filter(canDeleteShelf)

    return (
        <form className="bulk-add-setup" onSubmit={(event) => void continueToIntake(event)}>
            <h2>Choose your first {locationLabel}</h2>
            <p>Work one {locationLabel} at a time. Saved rows stay saved while unresolved rows remain available to correct.</p>
            {shelves.isPending ? <LoadingState label={`Loading ${locationLabel}s…`} /> : null}
            {shelves.isError ? (
                <QueryErrorState title={`Unable to load ${locationLabel}s`} error={shelves.error} onRetry={() => void shelves.refetch()} />
            ) : null}
            {!shelves.isPending && !shelves.isError ? (
                <>
                    <Field label={`Existing ${locationLabel}`} helpText={`Choose one, or name a new ${locationLabel} below.`}>
                        <select value={shelfId} onChange={(event) => setShelfId(event.target.value)} disabled={Boolean(newLocationName.trim())}>
                            <option value="">Choose a {locationLabel}</option>
                            {assignableShelves.map((shelf) => (
                                <option key={shelf.shelf_id} value={shelf.shelf_id}>
                                    {formatShelfCommonNameForDisplay(shelf.common_name)}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label={`New ${locationLabel} name`} helpText="Creating a new location selects it automatically.">
                        <input value={newLocationName} onChange={(event) => setNewLocationName(event.target.value)} />
                    </Field>
                </>
            ) : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
            <div className="form-actions">
                <Button type="submit" disabled={shelves.isPending || shelves.isError || createShelf.isPending}>
                    {createShelf.isPending ? 'Creating…' : `Continue to ${media === 'book' ? 'Book Build Mode' : 'Album Intake'}`}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setMedia(null); setError(null) }}>
                    Change medium
                </Button>
            </div>
        </form>
    )
}
