import { HttpError } from "@/api/base";
import LXNSService from "@/api/lxns";
import type { AvailableDataSourceType, CredentialsStorage } from "@/types/datasource";
import type { LXNSOAuth } from "@/types/lxns";
import { useLocalStorage, type RemovableRef } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed } from "vue";
import { toast } from "vue-sonner";
const EMPTY_OAUTH: LXNSOAuth = {
    access_token: "",
    access_token_expired: 0,
    refresh_token: "",
    refresh_token_expired: 0,
    pkce: false
}
const DEFAULT_CREDENTIALS: Record<AvailableDataSourceType, string> = {
    divingfish: '',
    lxns: '',
    usagi: ''
}
export type OAuthQueryType = 'query' | 'refresh'
export const useOAuthStore = defineStore("lxns-oauth", () => {
    const LXNSOAuth = useLocalStorage<LXNSOAuth>("lxns_oauth", { ...EMPTY_OAUTH })
    let refreshRequest: Promise<boolean> | null = null
    const hasLXNSOAuth = computed(() => {
        return LXNSOAuth.value.pkce === true && LXNSOAuth.value.access_token.length > 0
    })
    const isAccessTokenExpired = () => {
        return Date.now() >= (LXNSOAuth.value.access_token_expired ?? 0) - 30_000
    }
    const isRefreshTokenExpired = () => {
        return Date.now() >= (LXNSOAuth.value.refresh_token_expired ?? 0)
    }
    const saveLXNSOAuth = (value: LXNSOAuth) => {
        LXNSOAuth.value = value;
        // 在释放跨标签页刷新锁之前同步落盘，避免下个标签页读取已轮换的旧令牌。
        localStorage.setItem("lxns_oauth", JSON.stringify(value));
    }
    const cleanLXNSOAuth = () => {
        saveLXNSOAuth({ ...EMPTY_OAUTH });
    }
    const requestLXNSToken = async (code: string, type: OAuthQueryType): Promise<boolean> => {
        if (type === 'refresh' && (!LXNSOAuth.value.pkce || isRefreshTokenExpired())) {
            cleanLXNSOAuth();
            toast.error('落雪OAuth凭证失效，请重新授权', { position: 'top-center' });
            return false;
        }
        try {
            const result = type === 'query'
                ? await LXNSService.queryLXNSToken(code)
                : await LXNSService.refreshLXNSToken(LXNSOAuth.value.refresh_token);
            if (!result?.access_token || !result.refresh_token || !Number.isFinite(result.expires_in) || result.expires_in <= 0) {
                throw new Error('落雪返回的 OAuth 令牌格式无效');
            }
            const now = Date.now();
            saveLXNSOAuth({
                access_token: result.access_token,
                access_token_expired: now + result.expires_in * 1000,
                refresh_token: result.refresh_token,
                refresh_token_expired: now + 30 * 24 * 3600 * 1000,
                pkce: true,
            });
            return true;
        } catch (error: unknown) {
            if (error instanceof HttpError) {
                if (type === 'refresh' && (error.status === 401 || error.data?.body?.error === 'invalid_grant')) {
                    toast.error(`落雪OAuth凭证失效,请重新授权`, { position: "top-center" });
                    cleanLXNSOAuth();
                } else {
                    toast.error(`落雪OAuth更新失败 : ${error.message}`, { position: "top-center" })
                }
            } else {
                toast.error(`落雪OAuth更新失败 ${error instanceof Error ? error.message : 'Unknown Error'}`)
            }
            console.error("落雪OAuth更新失败", error);
            return false;
        }
    }
    const getLXNSToken = (code: string, type: OAuthQueryType = 'refresh'): Promise<boolean> => {
        if (type === 'query') return requestLXNSToken(code, type);
        if (refreshRequest) return refreshRequest;
        const refresh = async () => {
            // storage 事件可能尚未送达，获得锁后重新读取最新的轮换令牌。
            const stored = localStorage.getItem("lxns_oauth");
            if (stored) LXNSOAuth.value = JSON.parse(stored);
            else LXNSOAuth.value = { ...EMPTY_OAUTH };
            if (hasLXNSOAuth.value && !isAccessTokenExpired()) return true;
            return requestLXNSToken('', 'refresh');
        };
        refreshRequest = (globalThis.navigator?.locks
            ? navigator.locks.request('lxns-oauth-refresh', refresh)
            : refresh())
            .catch((error: unknown) => {
                toast.error(`落雪OAuth更新失败 ${error instanceof Error ? error.message : 'Unknown Error'}`);
                return false;
            })
            .finally(() => { refreshRequest = null; });
        return refreshRequest;
    }
    //Credentials
    const DataSourceCredentials: RemovableRef<CredentialsStorage> = useLocalStorage("credentials", DEFAULT_CREDENTIALS)
    const hasCredentials = (type: AvailableDataSourceType) => {
        return DataSourceCredentials.value[type].length > 0
    }
    const removeCredentials = (type: AvailableDataSourceType) => {
        DataSourceCredentials.value[type] = ''
    }
    return {
        hasLXNSOAuth, LXNSOAuth, getLXNSToken, isAccessTokenExpired, isRefreshTokenExpired, cleanLXNSOAuth,
        DataSourceCredentials, hasCredentials, removeCredentials
    }
});
