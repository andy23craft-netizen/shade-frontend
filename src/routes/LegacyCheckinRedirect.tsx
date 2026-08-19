import {
    Navigate,
    useLocation,
} from 'react-router-dom'

import { routeMetadata } from './routeMetadata'

export function LegacyCheckinRedirect() {
    const location = useLocation()

    return (
        <Navigate
            to={{
                pathname: routeMetadata.loans.path,
                search: location.search,
            }}
            replace
        />
    )
}
