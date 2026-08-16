/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_SECRET_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

interface Window {
    __SHADE_CONFIG__?: {
        apiBaseUrl?: unknown
        release?: unknown
        diagnostics?: unknown
    }
}

