import { useEffect, useRef } from 'react'
import {
    NavLink,
    Outlet,
    useLocation,
    useMatches,
} from 'react-router-dom'
import { useVersion } from '../api/versionQueries'
import { APP_VERSION } from '../config/appVersion'
import { DrawerNavMenu } from './DrawerNavMenu'

interface RouteHandle {
    title?: string
}

export function AppShell() {
    const { data: versionData } = useVersion()
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
                    <NavLink className="app-brand" to="/" end>
                        <span className="app-brand__name">
                            Shade Library
                        </span>

                        <span className="app-brand__established">
                            est. 2026
                        </span>
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
                                '/shelves',
                                '/admin/deleted',
                                '/admin/backup',
                                '/collection',
                                '/wishlists',
                            ]}
                            items={[
                                {
                                    label: 'Browse',
                                    to: '/books',
                                },
                                {
                                    label: 'Manage',
                                    to: '/collection/manage',
                                },
                                {
                                    label: 'Wishlists',
                                    to: '/wishlists',
                                },
                            ]}
                        />

                        <DrawerNavMenu
                            label="Circulation"
                            activePrefixes={[
                                '/loans',
                            ]}
                            items={[
                                {
                                    label: 'Loans',
                                    to: '/loans',
                                },
                            ]}
                        />
                    </nav>
                </div>
            </header>

            <main
                ref={mainRef}
                id="main-content"
                className="app-main"
                tabIndex={-1}
            >
                <Outlet />
            </main>

            <footer className="app-footer">
                <div className="app-footer__inner">
                    <span>Shade Library</span>
                    <span>{releaseLabel}</span>
                </div>
            </footer>
        </div>
    )
}
