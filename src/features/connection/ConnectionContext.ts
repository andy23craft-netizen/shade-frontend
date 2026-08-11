import { createContext } from 'react'

export interface ConnectionContextValue {
    status:
        | 'checking'
        | 'setup_required'
        | 'connected'
        | 'unauthorized'
        | 'unreachable'
    apiBaseUrl: string
    release: string
    hasToken: boolean
    errorMessage: string | null
    connect: (token: string) => Promise<boolean>
    retry: () => Promise<void>
    forgetConnection: () => void
}

export const ConnectionContext =
    createContext<ConnectionContextValue | null>(null)
