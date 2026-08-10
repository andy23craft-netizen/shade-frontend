import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { RootErrorBoundary } from './RootErrorBoundary'
import { router } from './routes/routes'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Unable to start Shade: root element was not found.')
}

createRoot(rootElement).render(
    <StrictMode>
        <RootErrorBoundary>
            <AppProviders>
                <RouterProvider router={router} />
            </AppProviders>
        </RootErrorBoundary>
    </StrictMode>,
)