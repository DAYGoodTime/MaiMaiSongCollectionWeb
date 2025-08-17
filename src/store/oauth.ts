import type { LXNSOAuth, LXNSOAuthResponse } from "@/types/lxns";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed } from "vue";
import { toast } from "vue-sonner";
const EMPTY_OAUTH: LXNSOAuth = {
    access_token: "",
    access_token_expired: 0,
    refresh_token: "",
    refresh_token_expired: 0
}
const ENV_HOST = import.meta.env.VITE_API_BASE_URL
export type OAuthQueryType = 'query' | 'refresh'
export const useOAuthStore = defineStore("lxns-oauth", () => {
    const LXNSOAuth = useLocalStorage("lxns_oauth", EMPTY_OAUTH)
    const hasLXNSOAuth = computed(() => {
        return LXNSOAuth.value.access_token.length > 0
    })
    const isAccessTokenExpired = () => {
        return new Date().getTime() >= (LXNSOAuth.value.access_token_expired ?? 0)
    }
    const isRefreshTokenExpired = () => {
        return new Date().getTime() >= (LXNSOAuth.value.refresh_token_expired ?? 0)
    }
    const refreshLXNSToken = async (code: string, type: OAuthQueryType = 'refresh') => {
        if (isRefreshTokenExpired() && type === 'refresh') {
            return false;
        }
        const url = `${ENV_HOST}${type === 'query' ? '/maimai/lxns/oauth' : '/maimai/lxns/oauth/refresh'}`
        let response = await fetch(url, {
            method: "GET",
            headers: {
                "authorization": type === 'refresh' ? LXNSOAuth.value.refresh_token : code
            }
        })
        if (!response.ok) {
            toast.error('请求落雪OAuth更新失败')
            return false;
        }
        const result = await response.json()
        if (!result.success) {
            toast.error(`落雪OAuth更新失败: ${result.message}`)
            return false;
        }
        let data: LXNSOAuthResponse = result.data.data
        let now = new Date().getTime();
        LXNSOAuth.value.access_token = data.access_token
        LXNSOAuth.value.access_token_expired = data.expires_in + now
        LXNSOAuth.value.refresh_token = data.refresh_token
        LXNSOAuth.value.refresh_token_expired = now + 30 * 24 * 3600 * 1000 //30 day
        return true
    }
    const cleanLXNSOAuth = () => {
        LXNSOAuth.value = EMPTY_OAUTH;
    }
    return { hasLXNSOAuth, LXNSOAuth, isAccessTokenExpired, isRefreshTokenExpired, refreshLXNSToken, cleanLXNSOAuth }
});
