import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppLink } from '../../components/AppLink'
import { useAuth } from './useAuth'

export function RequireAdmin({ children }: { children: ReactNode }) {
    const { isAdmin } = useAuth()
    const location = useLocation()
    if (isAdmin) return <>{children}</>
    return <section className="route-page"><h1>Administrator access required</h1><p>This area is available only after an administrator signs in.</p><AppLink to={location.pathname.startsWith('/albums') ? '/albums' : '/books'}>Continue browsing</AppLink></section>
}
