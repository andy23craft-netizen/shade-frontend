import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '../../api/apiClient'
import type { RuntimeConfig } from '../../config/runtimeConfig'
import type { DiagnosticReporter } from '../../diagnostics/diagnosticReporter'
import { AuthContext, type AccessMode } from './AuthContext'
import { notifySiteEnteredReadOnly } from '../siteReadOnly/siteReadOnlyBridge'

interface Credential {
    accessToken: string
    expiresAt: number
}

const SESSION_CREDENTIAL_KEY = 'shade:administrator-credential:v1'

function loadSessionCredential(): Credential | null {
    try {
        const stored = window.sessionStorage.getItem(SESSION_CREDENTIAL_KEY)
        if (!stored) return null
        const credential = JSON.parse(stored) as Credential
        if (typeof credential.accessToken !== 'string' || typeof credential.expiresAt !== 'number' || credential.expiresAt * 1000 <= Date.now()) {
            window.sessionStorage.removeItem(SESSION_CREDENTIAL_KEY)
            return null
        }
        return credential
    } catch {
        return null
    }
}

function saveSessionCredential(credential: Credential): void {
    try {
        window.sessionStorage.setItem(SESSION_CREDENTIAL_KEY, JSON.stringify(credential))
    } catch {
        // Sign-in remains usable when browser storage is unavailable.
    }
}

function removeSessionCredential(): void {
    try {
        window.sessionStorage.removeItem(SESSION_CREDENTIAL_KEY)
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

export function AuthProvider({ children, runtimeConfig, diagnosticReporter, initialMode = 'viewer', initialAccessToken = null }: AuthProviderProps) {
    const queryClient = useQueryClient()
    const [credential, setCredential] = useState<Credential | null>(() => initialAccessToken ? {
        accessToken: initialAccessToken,
        expiresAt: Math.floor(Date.now() / 1000) + 60 * 60,
    } : loadSessionCredential())
    const [mode, setMode] = useState<AccessMode>(() => initialAccessToken || loadSessionCredential() ? 'admin' : initialMode)

    const clearAdministratorAccess = useCallback(() => {
        setCredential(null)
        setMode('viewer')
        removeSessionCredential()
        // Protected responses must not remain visible after a credential is
        // revoked, expires, or is explicitly discarded.
        queryClient.clear()
    }, [queryClient])

    const apiClient = useMemo(() => createApiClient({
        apiBaseUrl: runtimeConfig.apiBaseUrl,
        getToken: () => credential?.accessToken ?? null,
        onUnauthorized: clearAdministratorAccess,
        onSiteReadOnly: notifySiteEnteredReadOnly,
        onRequestFailure: (error) => diagnosticReporter?.reportApiFailure(error),
    }), [clearAdministratorAccess, credential, diagnosticReporter, runtimeConfig.apiBaseUrl])

    useEffect(() => {
        if (!credential) return
        const timeout = window.setTimeout(clearAdministratorAccess, Math.max(0, credential.expiresAt * 1000 - Date.now()))
        return () => window.clearTimeout(timeout)
    }, [clearAdministratorAccess, credential])

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
        setCredential(nextCredential)
        saveSessionCredential(nextCredential)
        setMode('admin')
    }, [apiClient])

    const value = useMemo(() => ({
        mode,
        isAdmin: mode === 'admin',
        apiClient,
        signIn,
        signOut: clearAdministratorAccess,
    }), [apiClient, clearAdministratorAccess, mode, signIn])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
