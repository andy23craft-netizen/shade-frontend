import { useState } from 'react'
import {
    Alert,
    ConfirmationDialog,
} from '../../components'
import { isApiError, isSiteReadOnlyError } from '../../api/apiErrors'
import {
    useSiteReadOnlyStatus,
    useUpdateSiteReadOnly,
} from '../../api/libraryQueries'
import { useSiteReadOnly } from './useSiteReadOnly'

export function SiteReadOnlyToggle() {
    const { canToggle } = useSiteReadOnly()
    const statusQuery = useSiteReadOnlyStatus({
        enabled: canToggle,
    })
    const update = useUpdateSiteReadOnly()
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [pendingEnabled, setPendingEnabled] = useState<
        boolean | null
    >(null)

    if (!canToggle) {
        return null
    }

    // Fail open for the switch display when GET failed: treat as off so the
    // Shade admin can still attempt to enable deliberately.
    const enabled =
        statusQuery.isSuccess &&
        statusQuery.data.enabled === true
    const switchChecked =
        pendingEnabled !== null ? pendingEnabled : enabled

    function requestToggle(nextEnabled: boolean) {
        update.reset()
        setPendingEnabled(nextEnabled)
        setConfirmOpen(true)
    }

    function cancelToggle() {
        setConfirmOpen(false)
        setPendingEnabled(null)
        update.reset()
    }

    function confirmToggle() {
        if (pendingEnabled === null) {
            return
        }
        update.mutate(
            { enabled: pendingEnabled },
            {
                onSuccess: () => {
                    setConfirmOpen(false)
                    setPendingEnabled(null)
                },
            },
        )
    }

    const confirmTitle = pendingEnabled
        ? 'Turn on site-wide read-only mode?'
        : 'Turn off site-wide read-only mode?'
    const confirmBody = pendingEnabled
        ? 'All tenants will be unable to change the catalog, circulation, covers, or artwork until you turn this off. Use this only during a planned schema cutover.'
        : 'Normal write access will return for every tenant. Confirm only after the cutover backup and deploy steps are complete.'

    return (
        <fieldset
            className="library-settings-form__site-read-only"
            aria-describedby="site-read-only-help"
            data-read-only-exempt="true"
        >
            <legend>Site-wide read-only</legend>
            <p id="site-read-only-help" className="field__help">
                Shade admin only. Freezes database and cover or artwork writes
                for every library during schema cutover. This control stays
                available while read-only is on so you can exit.
            </p>
            {statusQuery.isError ? (
                <Alert variant="warning" title="Read-only status unavailable">
                    Could not load the current read-only status. Write controls
                    stay enabled until a successful status check or a live
                    read-only response.
                </Alert>
            ) : null}
            <label className="library-settings-form__switch-label">
                <input
                    type="checkbox"
                    role="switch"
                    checked={switchChecked}
                    disabled={update.isPending}
                    data-read-only-exempt="true"
                    onChange={(event) =>
                        requestToggle(event.target.checked)
                    }
                />
                <span
                    className="library-settings-form__switch"
                    aria-hidden="true"
                >
                    <span />
                </span>
                <span>
                    {switchChecked
                        ? 'Read-only on'
                        : 'Read-only off'}
                </span>
            </label>
            {update.isError ? (
                <Alert
                    variant="error"
                    title="Read-only mode was not updated"
                >
                    {isSiteReadOnlyError(update.error)
                        ? 'Site is in read-only mode.'
                        : isApiError(update.error)
                            ? update.error.message
                            : 'An unexpected error occurred.'}{' '}
                    The previous setting is unchanged.
                </Alert>
            ) : null}
            {update.isSuccess ? (
                <Alert variant="success">
                    {update.data.enabled
                        ? 'Site-wide read-only mode is on.'
                        : 'Site-wide read-only mode is off.'}
                </Alert>
            ) : null}
            <ConfirmationDialog
                open={confirmOpen}
                title={confirmTitle}
                confirmLabel={
                    pendingEnabled
                        ? 'Turn read-only on'
                        : 'Turn read-only off'
                }
                confirmVariant="danger"
                confirmDisabled={update.isPending}
                cancelDisabled={update.isPending}
                onConfirm={confirmToggle}
                onCancel={cancelToggle}
            >
                <p>{confirmBody}</p>
            </ConfirmationDialog>
        </fieldset>
    )
}
