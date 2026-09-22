import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { RootErrorBoundary } from './RootErrorBoundary'
import { RuntimeConfigScreen } from './config/RuntimeConfigScreen'
import { APP_VERSION } from './config/appVersion'
import { readRuntimeConfig } from './config/runtimeConfigState'
import { UnknownLibraryScreen } from './config/UnknownLibraryScreen'
import {
    applyLibraryDocumentMetadata,
    applyLibraryFavicon,
    applyLibraryTheme,
    resolveLibraryContext,
} from './config/libraryContext'
import { router } from './routes/routes'
import './index.css'
// The entry point intentionally has no exports; this lazy reader keeps the
// EPUB engine out of ordinary catalog visits.
// eslint-disable-next-line react-refresh/only-export-components
const BorrowerReaderPage = lazy(() => import('./features/epub/routes/BorrowerReaderPage').then((module) => ({ default: module.BorrowerReaderPage })))
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
applyLibraryDocumentMetadata(libraryContext, 'Home')
applyLibraryFavicon(window.location.hostname)

function renderApplication() {
    if (window.location.pathname === '/epub-reader') {
        root.render(<Suspense fallback={<main><p>Opening reader…</p></main>}><BorrowerReaderPage /></Suspense>)
        return
    }
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
            libraryId: libraryContext.id,
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
