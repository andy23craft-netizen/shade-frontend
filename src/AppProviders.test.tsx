import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from './AppProviders'
import { testDiagnosticReporter, testRuntimeConfig } from './test/renderAppTree'

function Probe({ seed = false }: { seed?: boolean }) {
    const client = useQueryClient()
    useEffect(() => { if (seed) client.setQueryData(['private'], 'andy-private') }, [client, seed])
    return <span>{String(client.getQueryData(['private']) ?? 'empty')}</span>
}

describe('AppProviders tenant cache lifetime', () => {
    afterEach(() => vi.restoreAllMocks())
    it('does not reuse query data across application mounts', () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
        const first = render(<AppProviders runtimeConfig={testRuntimeConfig} diagnosticReporter={testDiagnosticReporter}><Probe seed /></AppProviders>)
        first.unmount()
        render(<AppProviders runtimeConfig={testRuntimeConfig} diagnosticReporter={testDiagnosticReporter}><Probe /></AppProviders>)
        expect(screen.getByText('empty')).toBeInTheDocument()
    })
})
