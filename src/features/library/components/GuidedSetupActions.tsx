import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCompleteLibrarySetup } from '../../../api/libraryQueries'
import { Alert, Button } from '../../../components'
import {
    guidedSetupStorageKey,
    loadGuidedSetupSession,
    type GuidedSetupMedia,
} from '../guidedSetupSession'

export function GuidedSetupActions({
    media,
    hasUnresolved,
}: {
    media: GuidedSetupMedia
    hasUnresolved: boolean
}) {
    const [searchParams] = useSearchParams()

    if (searchParams.get('setup') !== '1') return null

    return <ActiveGuidedSetupActions media={media} hasUnresolved={hasUnresolved} />
}

function ActiveGuidedSetupActions({
    media,
    hasUnresolved,
}: {
    media: GuidedSetupMedia
    hasUnresolved: boolean
}) {
    const navigate = useNavigate()
    const complete = useCompleteLibrarySetup()
    const [error, setError] = useState<string | null>(null)

    async function finishSetup() {
        if (hasUnresolved && !window.confirm(
            'Complete setup now? Unresolved rows will remain saved locally so you can return to them later.',
        )) return

        setError(null)
        const key = guidedSetupStorageKey(window.location.hostname)
        const session = loadGuidedSetupSession(window.localStorage, key)
        const shelfIds = [...new Set(
            Object.values(session?.destinations ?? {}).map((destination) => destination.shelfId),
        )]

        try {
            await complete.mutateAsync({ initial_media: media, shelf_ids: shelfIds })
            navigate(media === 'book' ? '/reading-room/dashboard' : '/listening-room/dashboard')
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Library setup could not be completed.')
        }
    }

    return (
        <aside className="bulk-add-complete-actions" aria-labelledby="guided-setup-actions-heading">
            <div>
                <h2 id="guided-setup-actions-heading">Library setup</h2>
                <p>You may complete setup with zero, some, or all rows saved.</p>
            </div>
            {error ? <Alert variant="error" title="Setup was not completed">{error}</Alert> : null}
            <div className="form-actions">
                <Button type="button" disabled={complete.isPending} onClick={() => void finishSetup()}>
                    {complete.isPending ? 'Completing setup…' : 'Complete library setup'}
                </Button>
                <Button type="button" variant="secondary" disabled={complete.isPending} onClick={() => navigate('/library/setup')}>
                    Add another location
                </Button>
                <Button type="button" variant="secondary" disabled={complete.isPending} onClick={() => navigate('/collection/manage')}>
                    Save and leave
                </Button>
            </div>
        </aside>
    )
}
