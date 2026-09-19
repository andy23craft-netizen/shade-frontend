import {
    useCallback,
    useEffect,
    useMemo,
    type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import {
    currentLibraryHost,
    useSiteReadOnlyStatus,
} from '../../api/libraryQueries'
import { useAuth } from '../auth/useAuth'
import { SiteReadOnlyContext } from './SiteReadOnlyContext'
import { registerSiteReadOnlyHandler } from './siteReadOnlyBridge'

interface SiteReadOnlyProviderProps {
    children: ReactNode
}

export function SiteReadOnlyProvider({
    children,
}: SiteReadOnlyProviderProps) {
    const { isAdmin } = useAuth()
    const queryClient = useQueryClient()
    const host = currentLibraryHost()
    // The backend exclusively authorizes this operation. Its configured admin
    // tenant is private deployment state, so the browser cannot pre-authorize
    // a host from a compiled tenant catalogue.
    const canToggle = isAdmin
    const statusQuery = useSiteReadOnlyStatus({
        enabled: isAdmin,
    })

    const markEnabledFrom530 = useCallback(() => {
        // Re-skin immediately from a live mutating 530. Prefer the query cache so a
        // later successful GET/PUT remains the source of truth without effect sync.
        queryClient.setQueryData(
            queryKeys.library.siteReadOnly(host),
            { enabled: true },
        )
    }, [host, queryClient])

    useEffect(() => {
        registerSiteReadOnlyHandler(markEnabledFrom530)
        return () => {
            registerSiteReadOnlyHandler(null)
        }
    }, [markEnabledFrom530])

    // Fail open: pending or failed GET leaves writes enabled until a successful
    // status payload (or a 530 cache write) reports enabled: true.
    const enabled =
        isAdmin &&
        statusQuery.isSuccess &&
        statusQuery.data.enabled === true

    const value = useMemo(
        () => ({
            enabled,
            writesDisabled: enabled,
            canToggle,
        }),
        [canToggle, enabled],
    )

    return (
        <SiteReadOnlyContext.Provider value={value}>
            {children}
        </SiteReadOnlyContext.Provider>
    )
}
