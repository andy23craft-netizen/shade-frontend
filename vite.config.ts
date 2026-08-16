import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const repositoryRoot = join(
    dirname(fileURLToPath(import.meta.url)),
)

const appVersion = readFileSync(
    join(repositoryRoot, 'VERSION'),
    'utf8',
).trim()

if (appVersion === '') {
    throw new Error(
        'VERSION file is missing a valid application version.',
    )
}

/**
 * Optional same-origin API proxy for local development.
 *
 * Enable with `SHADE_API_PROXY=1`. Point `public/config.js` `apiBaseUrl` at the
 * Vite origin (for example `http://localhost:5173`) so the browser stays
 * same-origin while Vite forwards API paths to the backend.
 *
 * Default local work does not need the proxy: the backend already allows the
 * Vite origins `http://localhost:5173` and `http://127.0.0.1:5173`.
 */
function createDevServerProxy() {
    if (process.env.SHADE_API_PROXY !== '1') {
        return undefined
    }

    const target =
        process.env.SHADE_API_PROXY_TARGET ??
        'http://127.0.0.1:8000'

    return {
        '^/(health|books|loans|dashboard|backup|docs|redoc|openapi\\.json)':
            {
                target,
                changeOrigin: true,
            },
    }
}

const apiProxy = createDevServerProxy()

export default defineConfig({
    plugins: [react()],
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
    ...(apiProxy
        ? {
              server: {
                  proxy: apiProxy,
              },
          }
        : {}),
    test: {
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        include: [
            'src/**/*.{test,spec}.{ts,tsx}',
            'scripts/**/*.{test,spec}.ts',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.test.{ts,tsx}',
                'src/api/generated/**',
                'src/vite-env.d.ts',
                'src/main.tsx',
            ],
            thresholds: {
                statements: 88,
                branches: 83,
                functions: 92,
                lines: 88,
            },
        },
    },
})
