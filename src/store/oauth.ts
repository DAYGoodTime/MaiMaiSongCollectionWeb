import { HttpError } from "@/api/base";
import LXNSService from "@/api/lxns";
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
                case "query": result = await LXNSService.queryLXNSToken(code); break;
                case "refresh": result = await LXNSService.refreshLXNSToken(LXNSOAuth.value.refresh_token); break;
            }
        } catch (error: any) {
            if (error instanceof HttpError) {
                if (error.status === 401) {
                    toast.error(`落雪OAuth凭证失效,请重新授权`, { position: "top-center" });
                    //clean up auth info
                    cleanLXNSOAuth();
                } else {
                    toast.error(`落雪OAuth更新失败 : ${error.message}`, { position: "top-center" })
                }
            } else {
                toast.error(`落雪OAuth更新失败 ${error.message ? error.message : 'Unknown Error'}`)

            }
            console.error("落雪OAuth更新失败", error);
            return false;
        }
        if (result && result.success) {
            const data = result.data
            let now = new Date().getTime();
            LXNSOAuth.value.access_token = data.access_token
            LXNSOAuth.value.access_token_expired = data.expires_in + now
            LXNSOAuth.value.refresh_token = data.refresh_token
            LXNSOAuth.value.refresh_token_expired = now + 30 * 24 * 3600 * 1000 //30 day
            return true
        } else {
            toast.error(`落雪OAuth更新失败 ${result ? '' : '返回为空'}`)
            console.error("落雪OAuth更新失败", result);
            return false
        }
    }
    const cleanLXNSOAuth = () => {
        LXNSOAuth.value = EMPTY_OAUTH;
    }
    return { hasLXNSOAuth, LXNSOAuth, getLXNSToken, isAccessTokenExpired, isRefreshTokenExpired, cleanLXNSOAuth }
});
