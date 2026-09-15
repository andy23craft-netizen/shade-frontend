import { useSiteReadOnly } from './useSiteReadOnly'
import { useAuth } from '../auth/useAuth'

export function SiteReadOnlyBanner() {
    const { isAdmin } = useAuth()
    const { enabled } = useSiteReadOnly()

    if (!isAdmin || !enabled) {
        return null
    }

    return (
        <div
            className="site-read-only-banner"
            role="status"
            aria-live="polite"
        >
            <p className="site-read-only-banner__text">
                Site is in read-only mode. Catalog changes, circulation, and
                cover or artwork updates are disabled until the Shade admin
                turns read-only off in Library Settings.
            </p>
        </div>
    )
}
