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
import { DrawerNavMenu } from './DrawerNavMenu'
import shadeLibraryHeader from '../assets/Shade_Library_Header.webp'

interface RouteHandle {
    title?: string
}

const LAST_UPDATED = 'September 01, 2026'

export function AppShell() {
    const { data: versionData } = useVersion()
    const { data: dashboardData } = useDashboard()
    const location = useLocation()
    const matches = useMatches()
    const mainRef = useRef<HTMLElement>(null)
    const initialPathname = useRef(location.pathname)

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
        document.title = `${routeTitle} — Shade`
    }, [routeTitle])

    useEffect(() => {
        if (location.pathname === initialPathname.current) {
            return
        }

        mainRef.current?.focus()
    }, [location.pathname])

    return (
        <div className="app-shell">
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>

            <header className="app-header">
                <div className="app-header__inner">
                    <NavLink
                        className="app-brand"
                        to="/"
                        end
                        aria-label="Shade Library"
                    >
                        <img
                            src={shadeLibraryHeader}
                            alt=""
                            className="app-brand__image"
                        />
                    </NavLink>

                    <nav
                        className="app-nav"
                        aria-label="Primary navigation"
                    >
                        <NavLink
                            className="app-nav__link"
                            to="/dashboard"
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
                                '/albums',
                                '/shelves',
                                '/collection',
                                '/wishlists',
                                '/stash',
                            ]}
                            items={[
                                {
                                    label: 'Browse',
                                    to: '/books',
                                },
                                { label: 'Albums', to: '/albums' },
                                {
                                    label: `Stash (${dashboardData?.stash_count ?? 0})`,
                                    to: '/stash',
                                },
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
                            to="/loans"
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
                    </nav>
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
