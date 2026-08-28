import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const repositoryRoot = join(
    dirname(fileURLToPath(import.meta.url)),
)

const packageJson = JSON.parse(
    readFileSync(
        join(repositoryRoot, 'package.json'),
        'utf8',
    ),
) as {
    version?: unknown
}

const appVersion =
    typeof packageJson.version === 'string'
        ? packageJson.version.trim()
        : ''

if (appVersion === '') {
    throw new Error(
        'package.json is missing a valid version.',
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
        '^/(health|books|loans|dashboard|backup|docs|redoc|openapi\\.json|wishlists|collections)':
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
        testTimeout: 10_000,
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
                statements: 85,
                branches: 80,
                functions: 85,
                lines: 85,
            },
        },
    },
})
