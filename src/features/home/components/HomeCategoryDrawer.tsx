import {
    AppLink,
} from '../../../components'

interface HomeCategoryDrawerProps {
    name: string
    count: number
    href: string
}

export function HomeCategoryDrawer({
                                       name,
                                       count,
                                       href,
                                   }: HomeCategoryDrawerProps) {
    return (
        <li className="home-category-drawer">
            <AppLink
                to={href}
                className="home-category-drawer__link"
            >
                <span
                    className="home-category-drawer__face"
                    aria-hidden="true"
                >
                    <span className="home-category-drawer__panel">
                        <span className="home-category-drawer__label-holder">
                            <span className="home-category-drawer__label">
                                <span className="home-category-drawer__name">
                                    {name}
                                </span>

                                <span className="home-category-drawer__count">
                                    {count}{' '}
                                    {count === 1
                                        ? 'book'
                                        : 'books'}
                                </span>
                            </span>
                        </span>

                        <span className="home-category-drawer__pull" />
                    </span>
                </span>

                <span className="sr-only">
                    Browse {name}, {count}{' '}
                    {count === 1
                        ? 'book'
                        : 'books'}
                </span>
            </AppLink>
        </li>
    )
}
