import type { LXNSOAuthResponse, LXNSResponse } from "@/types/lxns"
import { request } from "./base"

export type LXNSAuthType = 'Token' | 'OAuth'

const ENV_HOST = import.meta.env.VITE_API_BASE_URL

export const queryDataFromLXNS = (credentials: string, _type: LXNSAuthType): Promise<LXNSResponse<any>> => {
    return new Promise((resolve, reject) => {
        try {
            if (credentials.length < 1) {
                reject({ success: false, message: "凭证为空" })
            }
            // 准备请求头
            let headers: Record<string, string> =
            {
                'Content-Type': 'application/json',
                'authorization': credentials
            }
            const apiUrl = `${ENV_HOST}/maimai/lxns`
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
            const url = `${ENV_HOST}/maimai/lxns/oauth`
            const requestOptions: RequestInit = {
                method: "GET",
                headers: { 'Content-Type': 'application/json', 'authorization': code }
            }
            request(url, requestOptions)
                .then(response => {
                    if (response.success) {
                        resolve(response.response)
                    } else {
                        reject(response)
                    }
                })
        } catch (error: any) {
            reject(error.details)
        }
    })
}
export const refreshLXNSToken = (refresh_token: string): Promise<LXNSResponse<LXNSOAuthResponse>> => {
    return new Promise((resolve, reject) => {
        try {
            const url = `${ENV_HOST}/maimai/lxns/oauth/refresh`
            const requestOptions: RequestInit = {
                method: "GET",
                headers: { 'Content-Type': 'application/json', 'authorization': refresh_token }
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