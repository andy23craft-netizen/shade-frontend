import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

export function AppShell() {
    const location = useLocation()
    const mainRef = useRef<HTMLElement>(null)

    useEffect(() => {
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
                    <NavLink className="app-brand" to="/">
                        Shade Library
                    </NavLink>

                    <nav className="app-nav" aria-label="Primary navigation">
                        <div className="app-nav__group">
                            <NavLink className="app-nav__link" to="/">
                                Dashboard
                            </NavLink>

                            <NavLink className="app-nav__link" to="/books">
                                Books
                            </NavLink>

                            <NavLink className="app-nav__link" to="/loans">
                                Loans
                            </NavLink>
                        </div>

                        <div className="app-nav__group app-nav__group--admin">
                            <NavLink className="app-nav__link" to="/books/new">
                                Add Book
                            </NavLink>
                        </div>
                    </nav>
                </div>
            </header>

            <main ref={mainRef} id="main-content" className="app-main">
                <Outlet />
            </main>

            <footer className="app-footer">
                <div className="app-footer__inner">
                    Shade Library
                </div>
            </footer>
        </div>
    )
}