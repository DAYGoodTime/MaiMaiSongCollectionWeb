import type { LXNSOAuthRefresh, LXNSOAuthRequest, LXNSOAuthResponse, LXNSResponse, LXNSScore } from "@/types/lxns"
import { createApiClient, isWebEnv } from "./base"
import apiRouterClient from "./router"

export type LXNSAuthType = 'Token' | 'OAuth'

export const LXNS_HOST = "https://maimai.lxns.net"
const APP_ID = import.meta.env.VITE_LXNS_OAUTH_APP_ID
const APP_SECRET = import.meta.env.VITE_LXNS_OAUTH_APP_SECRET
const APP_REDIRECT_URI = import.meta.env.VITE_LXNS_OAUTH_APP_REDIRECT_URI

async function handleLXNSError(response: Response) {
    const errorBody = await response.json();
    return {
        message: `LXNS API Error: ${errorBody.message || 'Unknown error'}`,
        body: errorBody
    };
}
const lxnsApiClient = createApiClient({
    baseUrl: LXNS_HOST,
    handleError: handleLXNSError,
});
const LXNSService = {
    queryDataFromLXNS: (credentials: string, type: LXNSAuthType): Promise<LXNSResponse<LXNSScore[]>> => {
        if (isWebEnv()) {
            return apiRouterClient(credentials).get<LXNSResponse<LXNSScore[]>>("maimai/lxns")
        } else {
            let headers: Record<string, string> = {}
            const isOAuthToken = credentials.startsWith("Bearer") && type === 'OAuth';
            if (isOAuthToken) {
                headers["Authorization"] = credentials
            } else {
                headers["X-User-Token"] = credentials
            }
            return lxnsApiClient.get<LXNSResponse<LXNSScore[]>>("api/v0/user/maimai/player/scores", { headers })
        }
    },
    queryLXNSToken: (code: string): Promise<LXNSResponse<LXNSOAuthResponse>> => {
        if (isWebEnv()) {
            return apiRouterClient(code).get<LXNSResponse<LXNSOAuthResponse>>("maimai/lxns/oauth")
        } else {
            const requestBody: LXNSOAuthRequest = {
                client_id: APP_ID,
                client_secret: APP_SECRET,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: APP_REDIRECT_URI
            }
            return lxnsApiClient.post<LXNSResponse<LXNSOAuthResponse>>("api/v0/oauth/token", requestBody)
        }
    },
    refreshLXNSToken: (refresh_token: string): Promise<LXNSResponse<LXNSOAuthResponse>> => {
        if (isWebEnv()) {
            return apiRouterClient(refresh_token).get("maimai/lxns/oauth/refresh")
        } else {
            const requestBody: LXNSOAuthRefresh = {
                client_id: APP_ID,
                client_secret: APP_SECRET,
                grant_type: "refresh_token",
                refresh_token,
            }
            return lxnsApiClient.post<LXNSResponse<LXNSOAuthResponse>>("api/v0/oauth/token", requestBody)
        }
    }
};
export default LXNSService;