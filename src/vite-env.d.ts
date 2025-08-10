/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_PROJECT_VERSION: string
    readonly VITE_LXNS_OAUTH_URI: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}