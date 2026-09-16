import { createContext } from 'react'

export interface SiteReadOnlyContextValue {
    /** True when site-wide read-only is known to be enabled (from GET or a live 530). */
    enabled: boolean
    /** True when write controls must be visibly disabled. Fail-open when status is unknown. */
    writesDisabled: boolean
    /** Shade (`andy`) admin may toggle site-wide read-only from Library Settings. */
    canToggle: boolean
}

export const SiteReadOnlyContext =
    createContext<SiteReadOnlyContextValue>({
        enabled: false,
        writesDisabled: false,
        canToggle: false,
    })
