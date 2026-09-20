import { Suspense, useEffect, useRef } from 'react'
import {
    NavLink,
    Outlet,
    useLocation,
    useMatches,
} from 'react-router-dom'
import { useVersion } from '../api/versionQueries'
import { useDashboard } from '../api/dashboardQueries'
import { LoadingState } from '../components/LoadingState'
import { APP_VERSION } from '../config/appVersion'
import {
    applyLibraryDocumentMetadata,
    getLibraryDisplayName,
    resolveLibraryContext,
} from '../config/libraryContext'
import { getLibraryBranding } from '../config/libraryBranding'
import { DrawerNavMenu } from './DrawerNavMenu'
import { AuthControl } from '../features/auth/AuthControl'
import { useAuth } from '../features/auth/useAuth'
import { SiteReadOnlyBanner } from '../features/siteReadOnly/SiteReadOnlyBanner'
import { useSiteReadOnly } from '../features/siteReadOnly/useSiteReadOnly'

interface RouteHandle {
    title?: string
}

const LAST_UPDATED = 'September 20, 2026'

export function AppShell() {
    const { isAdmin } = useAuth()
    const { writesDisabled } = useSiteReadOnly()
    const { data: versionData } = useVersion()
    const location = useLocation()
    const matches = useMatches()
    const mainRef = useRef<HTMLElement>(null)
    const initialPathname = useRef(location.pathname)
    const libraryContext = resolveLibraryContext(
        window.location.hostname,
    )
    const libraryName = getLibraryDisplayName(libraryContext)
    const libraryBranding = getLibraryBranding(libraryContext)
    const isListeningRoom = location.pathname === '/listening-room' || location.pathname.startsWith('/albums') || location.pathname.startsWith('/listening-room/')
    const isReadingRoom = location.pathname === '/reading-room' || location.pathname.startsWith('/books') || location.pathname.startsWith('/stash') || location.pathname.startsWith('/shelves') || location.pathname.startsWith('/reading-room/')
    const { data: dashboardData } = useDashboard({ enabled: isAdmin && isReadingRoom })
    const room = isListeningRoom ? 'listening' : isReadingRoom ? 'reading' : 'neutral'
    const isHallway = ['/collection/manage', '/collections', '/wishlists'].includes(location.pathname)
    const dashboardHref = room === 'listening' ? '/listening-room/dashboard' : '/reading-room/dashboard'
    const loansHref = room === 'listening' ? '/listening-room/loans' : '/reading-room/loans'
    const browseHref = room === 'listening' ? '/albums' : '/books'

    const currentRoute = [...matches]
        .reverse()
        .find((match) => {
            const handle = match.handle as RouteHandle | undefined
            return Boolean(handle?.title)
        })

    const routeTitle =
        (currentRoute?.handle as RouteHandle | undefined)?.title ??
        'Page Not Found'

    const apiVersion = versionData?.version?.trim()
    const releaseLabel =
        apiVersion !== undefined && apiVersion !== ''
            ? `Release ${APP_VERSION} · API ${apiVersion}`
            : `Release ${APP_VERSION}`

    useEffect(() => {
        applyLibraryDocumentMetadata(libraryContext, routeTitle)
    }, [libraryContext, routeTitle])

    useEffect(() => {
        if (location.pathname === initialPathname.current) {
            return
        }

        mainRef.current?.focus()
    }, [location.pathname])

    return (
        <div
            className={`app-shell app-shell--${room}`}
            data-room={room}
            data-access-mode={isAdmin ? 'admin' : 'viewer'}
            data-site-read-only={writesDisabled ? 'true' : 'false'}
        >
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>

            <SiteReadOnlyBanner />

            <header className="app-header">
                <div className="app-header__inner">
                    <AuthControl />
                    <NavLink
                        className="app-brand"
                        to="/"
                        end
                        aria-label={libraryName}
                    >
                        {libraryBranding.header ? <img
                            src={libraryBranding.header}
                            alt=""
                            className="app-brand__image"
                        /> : <span>{libraryName}</span>}
                    </NavLink>

                    {room !== 'neutral' ? <nav
                        className="app-nav"
                        aria-label={`${room === 'listening' ? 'Listening' : 'Reading'} Room navigation`}
                    >
                        {isAdmin ? <NavLink
                            className="app-nav__link"
                            to={dashboardHref}
                            end
                        >
    <span className="drawer-nav-menu__label-holder">
        <span className="drawer-nav-menu__label">
            Dashboard
        </span>
    </span>

                            <span
                                className="drawer-nav-menu__pull"
                                aria-hidden="true"
                            />
                        </NavLink> : null}

                        <DrawerNavMenu
                            label="Collection"
                            activePrefixes={[
                                '/books',
                                ...(room === 'listening' ? ['/albums'] : []),
                                '/shelves',
                                '/stash',
                            ]}
                            items={[
                                {
                                    label: 'Browse',
                                    to: browseHref,
                                },
                                ...(isAdmin ? [{
                                    label: 'Search by image',
                                    to: '/catalog/image-search',
                                }] : []),
                                ...(isAdmin && room === 'reading' ? [{
                                    label: `Stash (${dashboardData?.stash_count ?? 0})`,
                                    to: '/stash',
                                }] : []),
                                ...(isAdmin ? [{
                                    label: 'Manage',
                                    to: '/collection/manage',
                                }] : []),
                                {
                                    label:'Collections',
                                    to: '/collections',
                                },
                                {
                                    label: 'Wishlists',
                                    to: '/wishlists',
                                },
                            ]}
                        />

                        {isAdmin ? <NavLink
                            className="app-nav__link"
                            to={loansHref}
                        >
    <span className="drawer-nav-menu__label-holder">
        <span className="drawer-nav-menu__label">
            Loans
        </span>
    </span>

                            <span
                                className="drawer-nav-menu__pull"
                                aria-hidden="true"
                            />
                        </NavLink> : null}
                    </nav> : isAdmin && isHallway ? <nav className="app-nav app-nav--hallway" aria-label="Shared spaces navigation">
                        <NavLink className="app-nav__link" to="/reading-room"><span className="drawer-nav-menu__label-holder"><span className="drawer-nav-menu__label">Reading Room</span></span><span className="drawer-nav-menu__pull" aria-hidden="true" /></NavLink>
                        <NavLink className="app-nav__link" to="/listening-room"><span className="drawer-nav-menu__label-holder"><span className="drawer-nav-menu__label">Listening Room</span></span><span className="drawer-nav-menu__pull" aria-hidden="true" /></NavLink>
                    </nav> : null}
                </div>
            </header>

            <main
                ref={mainRef}
                id="main-content"
                className="app-main"
                tabIndex={-1}
            >
                <Suspense
                    fallback={
                        <LoadingState label="Loading page…" />
                    }
                >
                    <Outlet />
                </Suspense>
            </main>

            <footer className="app-footer">
                <div className="app-footer__inner">
        <span>
            Last updated {LAST_UPDATED}
        </span>

                    <span>{releaseLabel}</span>
                </div>
            </footer>
        </div>
    )
}
