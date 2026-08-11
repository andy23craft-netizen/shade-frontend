import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { RootErrorBoundary } from './RootErrorBoundary'
import { RuntimeConfigScreen } from './config/RuntimeConfigScreen'
import { readRuntimeConfig } from './config/runtimeConfigState'
import { router } from './routes/routes'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Unable to start Shade: root element was not found.')
}

const root = createRoot(rootElement)

function renderApplication() {
    const runtimeConfigState = readRuntimeConfig()

    if (runtimeConfigState.error || !runtimeConfigState.config) {
        root.render(
            <StrictMode>
                <RuntimeConfigScreen onRetry={renderApplication} />
            </StrictMode>,
        )

        return
    }

    root.render(
        <StrictMode>
            <RootErrorBoundary>
                <AppProviders runtimeConfig={runtimeConfigState.config}>
                    <RouterProvider router={router} />
                </AppProviders>
            </RootErrorBoundary>
        </StrictMode>,
    )
}

renderApplication()