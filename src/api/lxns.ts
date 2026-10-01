import type { LXNSOAuthRefresh, LXNSOAuthRequest, LXNSOAuthResponse, LXNSResponse, LXNSScore } from "@/types/lxns"
import { createApiClient } from "./base"

export type LXNSAuthType = 'Token' | 'OAuth'

export const LXNS_HOST = "https://maimai.lxns.net"
const APP_ID = import.meta.env.VITE_LXNS_OAUTH_APP_ID
const APP_REDIRECT_URI = import.meta.env.VITE_LXNS_OAUTH_APP_REDIRECT_URI
const PKCE_STORAGE_KEY = "lxns_oauth_pending"
const AUTHORIZATION_LIFETIME = 30 * 60 * 1000

interface PendingAuthorization {
    verifier: string
    state: string
    clientId: string
    redirectUri: string
    createdAt: number
}

function toBase64Url(bytes: Uint8Array) {
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function readPendingAuthorization(): PendingAuthorization {
    const stored = sessionStorage.getItem(PKCE_STORAGE_KEY)
    let pending: PendingAuthorization | null = null
    try {
        pending = stored ? JSON.parse(stored) : null
    } catch {
        sessionStorage.removeItem(PKCE_STORAGE_KEY)
    }
    if (!pending || typeof pending.verifier !== "string" || !/^[A-Za-z0-9_-]{43,128}$/.test(pending.verifier) ||
        !pending.state || !Number.isFinite(pending.createdAt) || pending.clientId !== APP_ID || pending.redirectUri !== APP_REDIRECT_URI ||
        Date.now() - pending.createdAt >= AUTHORIZATION_LIFETIME) {
        sessionStorage.removeItem(PKCE_STORAGE_KEY)
        throw new Error("授权会话不存在或已过期，请重新点击 OAuth 登录，并在当前标签页填写授权码")
    }
    return pending
}

async function handleLXNSError(response: Response) {
    const errorBody = await response.json().catch(() => ({}));
    return {
        message: `LXNS API Error: ${errorBody.error_description || errorBody.message || errorBody.error || response.statusText}`,
        body: errorBody
    };
}
const lxnsApiClient = createApiClient({
    baseUrl: LXNS_HOST,
    handleError: handleLXNSError,
});
const LXNSService = {
    createAuthorizationUrl: async (): Promise<string> => {
        if (!APP_ID || !APP_REDIRECT_URI) {
            throw new Error("请配置落雪 OAuth 应用 ID 和回调地址（无回调模式使用 urn:ietf:wg:oauth:2.0:oob）")
        }
        if (!globalThis.crypto?.subtle) {
            throw new Error("OAuth PKCE 需要安全环境，请使用 HTTPS 或 localhost")
        }
        const verifier = toBase64Url(crypto.getRandomValues(new Uint8Array(64)))
        const state = toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
        const url = new URL("/oauth/authorize", LXNS_HOST)
        url.search = new URLSearchParams({
            response_type: "code",
            client_id: APP_ID,
            redirect_uri: APP_REDIRECT_URI,
            scope: "read_player",
            state,
            code_challenge: toBase64Url(new Uint8Array(digest)),
            code_challenge_method: "S256",
        }).toString()
        sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify({
            verifier, state, clientId: APP_ID, redirectUri: APP_REDIRECT_URI, createdAt: Date.now(),
        } satisfies PendingAuthorization))
        return url.toString()
    },
    queryDataFromLXNS: (credentials: string, type: LXNSAuthType): Promise<LXNSResponse<LXNSScore[]>> => {
        const headers: Record<string, string> = type === 'OAuth'
            ? { Authorization: `Bearer ${credentials.replace(/^Bearer\s+/i, "").trim()}` }
            : { "X-User-Token": credentials.trim() }
        return lxnsApiClient.get<LXNSResponse<LXNSScore[]>>("api/v0/user/maimai/player/scores", { headers })
    },
    queryLXNSToken: async (input: string): Promise<LXNSOAuthResponse> => {
        const pending = readPendingAuthorization()
        let code = input.trim()
        // 无回调模式手填授权码；粘贴回调 URL 时必须额外校验 state。
        if (/^https?:\/\//i.test(code)) {
            const callback = new URL(code)
            const redirect = new URL(pending.redirectUri)
            if (callback.origin !== redirect.origin || callback.pathname !== redirect.pathname ||
                callback.searchParams.get("state") !== pending.state) {
                throw new Error("OAuth 回调地址或 state 不匹配，请重新授权")
            }
            if (callback.searchParams.has("error")) {
                throw new Error(callback.searchParams.get("error_description") || "落雪授权被拒绝")
            }
            code = callback.searchParams.get("code") || ""
        }
        if (!code) throw new Error("授权码不能为空")
        const requestBody: LXNSOAuthRequest = {
            client_id: pending.clientId,
            grant_type: "authorization_code",
            code,
            redirect_uri: pending.redirectUri,
            code_verifier: pending.verifier,
        }
        const result = await lxnsApiClient.post<LXNSOAuthResponse>("api/v0/oauth/token", requestBody)
        sessionStorage.removeItem(PKCE_STORAGE_KEY)
        return result
    },
    refreshLXNSToken: (refresh_token: string): Promise<LXNSOAuthResponse> => {
        const requestBody: LXNSOAuthRefresh = {
            client_id: APP_ID,
            grant_type: "refresh_token",
            refresh_token,
        }
        return lxnsApiClient.post<LXNSOAuthResponse>("api/v0/oauth/token", requestBody)
    }
};
export default LXNSService;
