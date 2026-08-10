import {
    createMemoryRouter,
    type InitialEntry,
} from 'react-router-dom'
import { routeConfig } from './routes'

export function createTestRouter(
    initialEntries: InitialEntry[] = ['/'],
) {
    return createMemoryRouter(routeConfig, {
        initialEntries,
    })
}