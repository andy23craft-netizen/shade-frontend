import { createContext } from 'react'
import type { createApiClient } from '../../api/apiClient'

export type AccessMode = 'viewer' | 'admin'

export interface AuthContextValue {
    mode: AccessMode
    isAdmin: boolean
    apiClient: ReturnType<typeof createApiClient>
    signIn: (password: string) => Promise<void>
    signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
