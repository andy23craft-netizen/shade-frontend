import { createContext } from 'react'
import type { createApiClient } from '../../api/apiClient'
import type { ConnectionStatus } from './connectionTypes'

export interface ConnectionContextValue {
    status: ConnectionStatus
    apiBaseUrl: string
    release: string
    errorMessage: string | null
    apiClient: ReturnType<typeof createApiClient>
}

export const ConnectionContext =
    createContext<ConnectionContextValue | null>(null)
