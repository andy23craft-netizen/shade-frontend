import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '../../api/apiClient'
import type { RuntimeConfig } from '../../config/runtimeConfig'
import type { DiagnosticReporter } from '../../diagnostics/diagnosticReporter'
import { AuthContext, type AccessMode } from './AuthContext'
import { notifySiteEnteredReadOnly } from '../siteReadOnly/siteReadOnlyBridge'
import { scheduleCredentialExpiry } from './authExpiry'

interface Credential {
    accessToken: string
    expiresAt: number
}

interface AuthState {
    credential: Credential | null
    mode: AccessMode
    revocationVersion: number
}

type AuthAction =
    | { type: 'sign-in'; credential: Credential }
    | { type: 'clear-administrator-access'; rejectedToken?: string | null }

function authReducer(state: AuthState, action: AuthAction): AuthState {
    if (action.type === 'sign-in') {
        return { ...state, credential: action.credential, mode: 'admin' }
    }

    if (action.rejectedToken !== undefined && action.rejectedToken !== state.credential?.accessToken) {
        return state
    }

    return {
        credential: null,
        mode: 'viewer',
        revocationVersion: state.revocationVersion + 1,
    }
}

const PERSISTENT_CREDENTIAL_KEY = 'shade:administrator-credential:v2'
const LEGACY_SESSION_CREDENTIAL_KEY = 'shade:administrator-credential:v1'

function loadPersistentCredential(): Credential | null {
    try {
        const stored = window.localStorage.getItem(PERSISTENT_CREDENTIAL_KEY) ?? window.sessionStorage.getItem(LEGACY_SESSION_CREDENTIAL_KEY)
        if (!stored) return null
        const credential = JSON.parse(stored) as Credential
        if (typeof credential.accessToken !== 'string' || typeof credential.expiresAt !== 'number' || credential.expiresAt * 1000 <= Date.now()) {
            window.localStorage.removeItem(PERSISTENT_CREDENTIAL_KEY)
            window.sessionStorage.removeItem(LEGACY_SESSION_CREDENTIAL_KEY)
            return null
        }
        // Preserve a valid pre-persistent login through the one-time migration.
        window.localStorage.setItem(PERSISTENT_CREDENTIAL_KEY, JSON.stringify(credential))
        window.sessionStorage.removeItem(LEGACY_SESSION_CREDENTIAL_KEY)
        return credential
    } catch {
        return null
    }
}

function savePersistentCredential(credential: Credential): void {
    try {
        window.localStorage.setItem(PERSISTENT_CREDENTIAL_KEY, JSON.stringify(credential))
    } catch {
        // Sign-in remains usable when browser storage is unavailable.
    }
}

function removePersistentCredential(): void {
    try {
        window.localStorage.removeItem(PERSISTENT_CREDENTIAL_KEY)
        // Remove the old short-lived storage entry during the migration.
        window.sessionStorage.removeItem(LEGACY_SESSION_CREDENTIAL_KEY)
    } catch {
        // Storage cleanup is best effort only.
    }
}

interface AdminTokenResponse {
    access_token: string
    expires_at: number
    token_type?: 'bearer'
}

interface AuthProviderProps {
    children: ReactNode
    runtimeConfig: RuntimeConfig
    diagnosticReporter?: DiagnosticReporter
    initialMode?: AccessMode
    initialAccessToken?: string | null
}

function buildAuthApiClient(
    apiBaseUrl: string,
    accessToken: string | null,
    onUnauthorized: (rejectedToken?: string | null) => void,
    diagnosticReporter?: DiagnosticReporter,
) {
    return createApiClient({
        apiBaseUrl,
        getToken: () => accessToken,
        onUnauthorized: (rejectedToken) => {
            queueMicrotask(() => onUnauthorized(rejectedToken))
        },
        onSiteReadOnly: notifySiteEnteredReadOnly,
        onRequestFailure: (error) => diagnosticReporter?.reportApiFailure(error),
    })
}

export function AuthProvider({ children, runtimeConfig, diagnosticReporter, initialMode = 'viewer', initialAccessToken = null }: AuthProviderProps) {
    const queryClient = useQueryClient()
    const [authState, dispatch] = useReducer(authReducer, undefined, () => {
        const credential = initialAccessToken ? {
            accessToken: initialAccessToken,
            expiresAt: Math.floor(Date.now() / 1000) + 60 * 60,
        } : loadPersistentCredential()
        return { credential, mode: credential ? 'admin' : initialMode, revocationVersion: 0 }
    })
    const { credential, mode } = authState

    const clearAdministratorAccess = useCallback((rejectedToken?: string | null) => {
        // An earlier request can finish after a newer sign-in has committed.
        // It must never revoke the newer session.
        dispatch({ type: 'clear-administrator-access', rejectedToken })
    }, [])

    useEffect(() => {
        if (authState.revocationVersion === 0) return
        removePersistentCredential()
        // Preserve public catalog data while dropping private/admin-only data.
        queryClient.removeQueries({ predicate: (query) => ['dashboard', 'loans', 'library', 'household-profiles', 'quotes', 'epub', 'pdf-library'].includes(String(query.queryKey[0])) })
    }, [authState.revocationVersion, queryClient])

    const apiClient = useMemo(() => buildAuthApiClient(
        runtimeConfig.apiBaseUrl,
        credential?.accessToken ?? null,
        clearAdministratorAccess,
        diagnosticReporter,
    ), [clearAdministratorAccess, credential, diagnosticReporter, runtimeConfig.apiBaseUrl])

    useEffect(() => {
        if (!credential) return
        return scheduleCredentialExpiry(
            credential.expiresAt,
            clearAdministratorAccess,
        )
    }, [clearAdministratorAccess, credential])

    useEffect(() => {
        if (credential) {
            // Run this only after the provider has committed the new client,
            // ensuring protected observers use the fresh Bearer token.
            void queryClient.invalidateQueries()
        }
    }, [credential, queryClient])

    const signIn = useCallback(async (password: string) => {
        // This deliberately uses the same client transport, but never sends a
        // pre-existing credential or stores the password.
        const response = await apiClient.requestJson<AdminTokenResponse>('/auth/sign-in', {
            method: 'POST',
            authenticated: false,
            body: { password },
        })
        const nextCredential = {
            accessToken: response.access_token,
            expiresAt: response.expires_at,
        }
        dispatch({ type: 'sign-in', credential: nextCredential })
        savePersistentCredential(nextCredential)
    }, [apiClient])

    const signOut = useCallback(async () => {
        const token = credential?.accessToken
        // The UI and local storage change immediately; the best-effort revoke
        // request still uses the captured token.
        clearAdministratorAccess()
        if (!token) return
        const logoutClient = createApiClient({ apiBaseUrl: runtimeConfig.apiBaseUrl, getToken: () => token, onRequestFailure: (error) => diagnosticReporter?.reportApiFailure(error) })
        try {
            await logoutClient.request('/auth/sign-out', { method: 'POST', authenticated: true })
        } catch {
            // A previously expired/revoked session is already logged out locally.
        }
    }, [clearAdministratorAccess, credential?.accessToken, diagnosticReporter, runtimeConfig.apiBaseUrl])

    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        await apiClient.requestJson('/auth/change-password', { method: 'POST', body: { current_password: currentPassword, new_password: newPassword }, authenticated: true })
        // The contract invalidates every session after a password change.
        clearAdministratorAccess()
    }, [apiClient, clearAdministratorAccess])

    const value = useMemo(() => ({
        mode,
        isAdmin: mode === 'admin',
        apiClient,
        signIn,
        signOut,
        changePassword,
    }), [apiClient, changePassword, mode, signIn, signOut])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
