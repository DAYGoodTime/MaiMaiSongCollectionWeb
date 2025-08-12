import type { LXNSOAuthRefresh, LXNSOAuthRequest, LXNSOAuthResponse, LXNSResponse } from "@/types/lxns"
import { request } from "./base"

export type LXNSAuthType = 'Token' | 'OAuth'

export const LXNS_HOST = "https://maimai.lxns.net"

export const queryDataFromLXNS = (credentials: string, type: LXNSAuthType): Promise<LXNSResponse<any>> => {
    return new Promise((resolve, reject) => {
        try {
            if (credentials.length < 1) {
                reject({ success: false, message: "凭证为空" })
            }
            // 准备请求头
            let headers: Record<string, string> = { 'Content-Type': 'application/json' }
            const apiUrl = `${LXNS_HOST}/api/v0/user/maimai/player/scores`
            const isOAuthToken = credentials.startsWith("Bearer") && type === 'OAuth';
            if (isOAuthToken) {
                headers["Authorization"] = credentials
            } else {
                headers["X-User-Token"] = credentials
            }
            const requestOptions: RequestInit = {
                method: 'GET',
                headers,
            };
            request(apiUrl, requestOptions)
                .then(response => {
                    if (response.success) {
                        resolve(response.response)
                    } else {
                        reject(response)
                    }
                })
        } catch (error) {
            reject(error)
        }
    })
}
export const queryLXNSToken = (code: string): Promise<LXNSResponse<LXNSOAuthResponse>> => {
    return new Promise((resolve, reject) => {
        try {
            const url = `${LXNS_HOST}/api/v0/oauth/token`
            const requestBody: LXNSOAuthRequest = {
                client_id: APP_ID,
                client_secret: APP_SECRET,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: APP_REDIRECT_URI
            }
            const requestOptions: RequestInit = {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            }
            request(url, requestOptions)
                .then(response => {
                    if (response.success) {
                        resolve(response.response)
                    } else {
                        reject(response)
                    }
                })
        } catch (error) {
            reject(error)
        }
    })
}
export const refreshLXNSToken = (refresh_token: string): Promise<LXNSResponse<LXNSOAuthResponse>> => {
    return new Promise((resolve, reject) => {
        try {
            const url = `${LXNS_HOST}/api/v0/oauth/token`
            const requestBody: LXNSOAuthRefresh = {
                client_id: APP_ID,
                client_secret: APP_SECRET,
                grant_type: "refresh_token",
                refresh_token,
            }
            const requestOptions: RequestInit = {
                method: "POST",
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            }
            request(url, requestOptions)
                .then(response => {
                    if (response.success) {
                        resolve(response.response)
                    } else {
                        reject(response)
                    }
                })
        } catch (error) {
            reject(error)
        }
    })
}