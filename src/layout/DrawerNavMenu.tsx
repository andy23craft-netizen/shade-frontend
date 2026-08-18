import {
    useEffect,
    useRef,
    useState,
} from 'react'
import {
    NavLink,
    useLocation,
} from 'react-router-dom'

interface DrawerNavItem {
    label: string
    to: string
}

interface DrawerNavMenuProps {
    label: string
    items: readonly DrawerNavItem[]
    activePrefixes?: readonly string[]
}

export function DrawerNavMenu({
    label,
    items,
    activePrefixes = [],
}: DrawerNavMenuProps) {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const location = useLocation()

    const isActive = activePrefixes.some((prefix) =>
        location.pathname.startsWith(prefix),
    )

    useEffect(() => {
        setOpen(false)
    }, [location.pathname])

    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            const target = event.target

            if (
                target instanceof Node &&
                !containerRef.current?.contains(target)
            ) {
                setOpen(false)
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false)
            }
        }

        document.addEventListener(
            'pointerdown',
            handlePointerDown,
        )
        document.addEventListener(
            'keydown',
            handleKeyDown,
        )

        return () => {
            document.removeEventListener(
                'pointerdown',
                handlePointerDown,
            )
            document.removeEventListener(
                'keydown',
                handleKeyDown,
            )
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className="drawer-nav-menu"
        >
            <button
                className="drawer-nav-menu__trigger"
                type="button"
                aria-expanded={open}
                aria-haspopup="true"
                data-active={isActive ? 'true' : undefined}
                onClick={() => setOpen((current) => !current)}
            >
    <span className="drawer-nav-menu__label-holder">
        <span className="drawer-nav-menu__label">
            {label}
        </span>
    </span>

                <span
                    className="drawer-nav-menu__indicator"
                    aria-hidden="true"
                >
        ▾
    </span>

                <span
                    className="drawer-nav-menu__pull"
                    aria-hidden="true"
                />
            </button>

            {open ? (
                <div className="drawer-nav-menu__panel">
                    {items.map((item) => (
                        <NavLink
                            key={item.to}
                            className="drawer-nav-menu__link"
                            to={item.to}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
