/// <reference types="vite/client" />

import type { readonly } from "vue"

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_PROJECT_VERSION: string
    readonly VITE_LXNS_OAUTH_URI: string
    readonly VITE_LXNS_OAUTH_APP_ID: string
    readonly VITE_LXNS_OAUTH_APP_SECRET: string
    readonly VITE_LXNS_OAUTH_APP_REDIRECT_URI: string
    readonly VITE_USAGI_DEV_TOKEN: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}