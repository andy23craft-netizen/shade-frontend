import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { RootErrorBoundary } from './RootErrorBoundary'
import { RuntimeConfigScreen } from './config/RuntimeConfigScreen'
import { readApiToken } from './config/apiToken'
import { readRuntimeConfig } from './config/runtimeConfigState'
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

function renderApplication() {
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
            release:
            runtimeConfigState.config.release,
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
