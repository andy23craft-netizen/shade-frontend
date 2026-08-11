import { useEffect, useRef } from 'react'
import {
    NavLink,
    Outlet,
    useLocation,
    useMatches,
} from 'react-router-dom'
import { useConnection } from '../features/connection/useConnection'

interface RouteHandle {
    title?: string
}

export function AppShell() {
    const { release } = useConnection()
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

    useEffect(() => {
        document.title = `${routeTitle} — Shade`
    }, [routeTitle])

    useEffect(() => {
        if (location.pathname === initialPathname.current) {
            return
        }

        const heading = mainRef.current?.querySelector('h1')

        if (heading instanceof HTMLElement) {
            heading.focus()
        }
    }, [location.pathname])

    return (
        <div className="app-shell">
            <a className="skip-link" href="#main-content">
                Skip to main content
            </a>

            <header className="app-header">
                <div className="app-header__inner">
                    <NavLink className="app-brand" to="/" end>
                        Shade Library
                    </NavLink>

                    <nav
                        className="app-nav"
                        aria-label="Primary navigation"
                    >
                        <div className="app-nav__group">
                            <NavLink
                                className="app-nav__link"
                                to="/"
                                end
                            >
                                Dashboard
                            </NavLink>

                            <NavLink
                                className="app-nav__link"
                                to="/books"
                                end
                            >
                                Books
                            </NavLink>

                            <NavLink
                                className="app-nav__link"
                                to="/books/new"
                                end
                            >
                                Add Book
                            </NavLink>

                            <NavLink
                                className="app-nav__link"
                                to="/checkout"
                                end
                            >
                                Check Out
                            </NavLink>

                            <NavLink
                                className="app-nav__link"
                                to="/checkin"
                                end
                            >
                                Check In
                            </NavLink>

                            <NavLink
                                className="app-nav__link"
                                to="/loans"
                                end
                            >
                                Loans
                            </NavLink>
                        </div>

                        <div
                            className="app-nav__group app-nav__group--admin"
                            aria-label="Administration and settings"
                        >
                            <NavLink
                                className="app-nav__link"
                                to="/admin/deleted"
                                end
                            >
                                Deleted Books
                            </NavLink>

                            <NavLink
                                className="app-nav__link"
                                to="/admin/backup"
                                end
                            >
                                Backup Library
                            </NavLink>

                            <NavLink
                                className="app-nav__link"
                                to="/settings/connection"
                                end
                            >
                                Connection Settings
                            </NavLink>
                        </div>
                    </nav>
                </div>
            </header>

            <main
                ref={mainRef}
                id="main-content"
                className="app-main"
            >
                <Outlet />
            </main>

            <footer className="app-footer">
                <div className="app-footer__inner">
                    <span>Shade Library</span>
                    <span>Release {release}</span>
                </div>
            </footer>
        </div>
    )
}