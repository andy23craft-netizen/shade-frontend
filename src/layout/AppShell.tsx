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
    formatLibraryDocumentTitle,
    getLibraryDisplayName,
    resolveLibraryContext,
} from '../config/libraryContext'
import { getLibraryBranding } from '../config/libraryBranding'
import { DrawerNavMenu } from './DrawerNavMenu'

interface RouteHandle {
    title?: string
}

const LAST_UPDATED = 'September 01, 2026'

export function AppShell() {
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
    const { data: dashboardData } = useDashboard({ enabled: isReadingRoom })
    const room = isListeningRoom ? 'listening' : isReadingRoom ? 'reading' : 'neutral'
    const isHome = location.pathname === '/'
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
        document.title = formatLibraryDocumentTitle(
            routeTitle,
            libraryContext,
        )
    }, [libraryContext, routeTitle])

    useEffect(() => {
        if (location.pathname === initialPathname.current) {
            return
        }

        mainRef.current?.focus()
    }, [location.pathname])

    return (
        <div className={`app-shell app-shell--${room}`} data-room={room}>
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>

            {!isHome ? <header className="app-header">
                <div className="app-header__inner">
                    <NavLink
                        className="app-brand"
                        to="/"
                        end
                        aria-label={libraryName}
                    >
                        <img
                            src={libraryBranding.header}
                            alt=""
                            className="app-brand__image"
                        />
                    </NavLink>

                    {room !== 'neutral' ? <nav
                        className="app-nav"
                        aria-label={`${room === 'listening' ? 'Listening' : 'Reading'} Room navigation`}
                    >
                        <NavLink
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
                        </NavLink>

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
                                ...(room === 'reading' ? [{
                                    label: `Stash (${dashboardData?.stash_count ?? 0})`,
                                    to: '/stash',
                                }] : []),
                                {
                                    label: 'Manage',
                                    to: '/collection/manage',
                                },
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

                        <NavLink
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
                        </NavLink>
                    </nav> : isHallway ? <nav className="app-nav app-nav--hallway" aria-label="Shared spaces navigation">
                        <NavLink className="app-nav__link" to="/reading-room"><span className="drawer-nav-menu__label-holder"><span className="drawer-nav-menu__label">Reading Room</span></span><span className="drawer-nav-menu__pull" aria-hidden="true" /></NavLink>
                        <NavLink className="app-nav__link" to="/listening-room"><span className="drawer-nav-menu__label-holder"><span className="drawer-nav-menu__label">Listening Room</span></span><span className="drawer-nav-menu__pull" aria-hidden="true" /></NavLink>
                    </nav> : null}
                </div>
            </header> : null}

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
