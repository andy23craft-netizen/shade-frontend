/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface ImportMetaEnv {
    readonly VITE_API_SECRET_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

interface Window {
    __SHADE_CONFIG__?: {
        apiBaseUrl?: unknown
        diagnostics?: unknown
    }
}
