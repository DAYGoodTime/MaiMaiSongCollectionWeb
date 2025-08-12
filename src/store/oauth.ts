import { queryLXNSToken, refreshLXNSToken } from "@/api/lxns";
import type { LXNSOAuth } from "@/types/lxns";
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
    const getLXNSToken = async (code: string, type: OAuthQueryType = 'refresh') => {
        if (isRefreshTokenExpired() && type === 'refresh') {
            return false;
        }
        let result;
        try {
            switch (type) {
                case "query": result = await queryLXNSToken(code); break;
                case "refresh": result = await refreshLXNSToken(LXNSOAuth.value.refresh_token); break;
            }
        } catch (error: any) {
            if (error.details) {
                //invalid auth
                if (error.details.code === 401) {
                    toast.error('落雪OAuth凭证失效,请重新授权', { position: "top-center" })
                    return false;
                }
            }
            toast.error(`落雪OAuth更新失败 ${error.message ? error.message : ''}`)
            console.error(error);
            return false;
        }
        if (!result || !result.success) return false;
        const data = result.data
        let now = new Date().getTime();
        LXNSOAuth.value.access_token = data.access_token
        LXNSOAuth.value.access_token_expired = data.expires_in + now
        LXNSOAuth.value.refresh_token = data.refresh_token
        LXNSOAuth.value.refresh_token_expired = now + 30 * 24 * 3600 * 1000 //30 day
        return true
    }
    return { hasLXNSOAuth, LXNSOAuth, isAccessTokenExpired, isRefreshTokenExpired, getLXNSToken }
});
