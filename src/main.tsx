import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { RootErrorBoundary } from './RootErrorBoundary'
import { RuntimeConfigScreen } from './config/RuntimeConfigScreen'
import { readApiToken } from './config/apiToken'
import { APP_VERSION } from './config/appVersion'
import { readRuntimeConfig } from './config/runtimeConfigState'
import { UnknownLibraryScreen } from './config/UnknownLibraryScreen'
import {
    applyLibraryTheme,
    resolveLibraryContext,
} from './config/libraryContext'
import { router } from './routes/routes'
import './index.css'
import {
    createDiagnosticReporter,
} from './diagnostics/diagnosticReporter'

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Unable to start Shade: root element was not found.')
}

const root = createRoot(rootElement)
const libraryContext = resolveLibraryContext(window.location.hostname)

applyLibraryTheme(libraryContext)

function renderApplication() {
    if (!libraryContext) {
        root.render(
            <StrictMode>
                <UnknownLibraryScreen
                    hostname={window.location.hostname}
                />
            </StrictMode>,
        )

        return
    }

    readApiToken()

    const runtimeConfigState = readRuntimeConfig()

    if (runtimeConfigState.error || !runtimeConfigState.config) {
        root.render(
            <StrictMode>
                <RuntimeConfigScreen onRetry={renderApplication} />
            </StrictMode>,
        )

        return
    }

    const diagnosticReporter =
        createDiagnosticReporter({
            config:
            runtimeConfigState.config.diagnostics,
            release: APP_VERSION,
        })

    root.render(
        <StrictMode>
            <RootErrorBoundary
                diagnosticReporter={diagnosticReporter}
            >
                <AppProviders
                    runtimeConfig={
                        runtimeConfigState.config
                    }
                    diagnosticReporter={
                        diagnosticReporter
                    }
                >
                    <RouterProvider router={router} />
                </AppProviders>
            </RootErrorBoundary>
        </StrictMode>,
    )
}

renderApplication()
