import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createApiClient } from '../../api/apiClient'
import type { RuntimeConfig } from '../../config/runtimeConfig'
import type { DiagnosticReporter } from '../../diagnostics/diagnosticReporter'
import { AuthContext, type AccessMode } from './AuthContext'

interface Credential {
    accessToken: string
    expiresAt: number
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
    } : null)
    const [mode, setMode] = useState<AccessMode>(initialMode)

    const clearAdministratorAccess = useCallback(() => {
        setCredential(null)
        setMode('viewer')
        // Protected responses must not remain visible after a credential is
        // revoked, expires, or is explicitly discarded.
        queryClient.clear()
    }, [queryClient])

    const apiClient = useMemo(() => createApiClient({
        apiBaseUrl: runtimeConfig.apiBaseUrl,
        getToken: () => credential?.accessToken ?? null,
        onUnauthorized: clearAdministratorAccess,
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
        setCredential({
            accessToken: response.access_token,
            expiresAt: response.expires_at,
        })
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
