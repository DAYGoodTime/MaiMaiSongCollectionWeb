<template>
    <div>
        <DataSourceCard
            title="落雪数据源"
            description="管理落雪成绩的同步和更新"
            source-key="lxns"
            :update-time="ScoreStore.LXNSScores.update_time"
            :is-updating="DataSourceUpdating"
            dialog-title="落雪数据源认证"
            credential-label="API密钥"
            credential-placeholder="个人 API 密钥"
            ref="cardRef"
            @request-update="handelLXNSDialog"
            @update="handleDialogSubmit"
            @export="ScoreStore.exportScores('lxns')"
            @delete="ScoreStore.ClearDataSource('lxns')"
            @set-default="ScoreStore.switchDataSource('lxns')"
        >
            <template #icon>
                <Snowflake class="h-5 w-5" />
            </template>
            <template #dialog-description>
                <p>请输入您的落雪账号个人 API 密钥。可前往<a class="text-blue-600 hover:underline"
                        href="https://maimai.lxns.net/user/profile" target="_blank">账号详情</a>生成。</p>
                <p>或者尝试下使用OAuth登录 <a @click="handelUseOAuth" class="text-blue-600 hover:underline"
                        :href="LXNS_OAUTH_URI" target="_blank">使用OAuth</a></p>
            </template>
        </DataSourceCard>

        <!-- 落雪OAuth对话框（保留在 LXNSCard 内部） -->
        <Dialog v-model:open="showLxnsOAuthDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>使用落雪OAuth (测试中)</DialogTitle>
                    <DialogDescription>
                        <p>使用落雪OAuth可以保存一个相对长期（30天）的令牌，无需在反复填写个人Token</p>
                        <p>我们已为你跳转到落雪的授权页面，如果没有请点击<a
                                @click="() => handelCopy(LXNS_OAUTH_URI, '已成功复制跳转链接，已便你需要在其它地方进行授权')"
                                class="text-blue-600 hover:underline" :href="LXNS_OAUTH_URI"
                                target="_blank">跳转OAuth授权</a>
                        </p>
                        <p>在授权成功后，请将获得的授权码填入此处</p>
                    </DialogDescription>
                </DialogHeader>
                <form @submit.prevent="() => submitOAuthCode()" class="space-y-4 pt-4">
                    <div class="space-y-2">
                        <Label for="lxns-oauth-code">授权码</Label>
                        <Input id="lxns-oauth-code" v-model="oauthCode" placeholder="落雪OAuth授权码" required />
                    </div>
                    <DialogFooter class="gap-4 lg:gap-2">
                        <Button type="button" variant="outline" @click="showLxnsOAuthDialog = false">
                            取消
                        </Button>
                        <Button type="submit" :disabled="DataSourceUpdating">
                            {{ DataSourceUpdating ? '更新中...' : '确认更新' }}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Snowflake } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Button } from '@/components/shadcn/ui/button'
import { toast } from 'vue-sonner';
import { useOAuthStore } from '@/store/oauth';
import { useCopyHelper } from '@/utils/functionUtil';
import LXNSService, { type LXNSAuthType } from '@/api/lxns'
import { storeToRefs } from 'pinia'
import { HttpError } from '@/api/base'
import { MAX_ERROR_COUNT, useScores } from '@/store/datasources/scores'
import DataSourceCard from './DataSourceCard.vue'

const DataSourceUpdating = ref(false)
const showLxnsOAuthDialog = ref(false)
// oauthCode 仅用于 OAuth Dialog 的输入
const oauthCode = ref('')
// lxnsToken 用于 Token 更新流程中传递凭证
const lxnsToken = ref('')
const ErrorCount = ref(0);
const LXNS_OAUTH_URI = import.meta.env.VITE_LXNS_OAUTH_URI
const OAuthStore = useOAuthStore()
const ScoreStore = useScores();
const { isAccessTokenExpired, isRefreshTokenExpired, getLXNSToken, cleanLXNSOAuth } = useOAuthStore();
const { hasLXNSOAuth, LXNSOAuth } = storeToRefs(useOAuthStore())
const { handelCopy } = useCopyHelper()
const cardRef = ref<InstanceType<typeof DataSourceCard>>()

// 更新落雪数据源核心逻辑
const updateLXNSDataSource = async (token: string, type: LXNSAuthType = 'Token', remember = false) => {
    if (!token) {
        toast.error(`请填写您的落雪${type === 'Token' ? '账号个人 API 密钥' : 'OAuth授权码'}`)
        return
    }
    DataSourceUpdating.value = true
    try {
        const result = await LXNSService.queryDataFromLXNS(token, type)
        if (result) {
            if (result.success) {
                ScoreStore.updateScores(result.data, "lxns")
                toast.success('落雪数据源更新成功！')
                if (type === 'Token' && remember) {
                    OAuthStore.DataSourceCredentials.lxns = token
                }
                cardRef.value?.closeDialog()
                showLxnsOAuthDialog.value = false
                oauthCode.value = ''
            } else {
                toast.error(`落雪数据源更新失败 code:${result.code}`)
                console.error("落雪数据源更新失败", result);
            }
        } else {
            toast.error('落雪数据源更新失败,返回的数据源为空')
        }
    } catch (error: any) {
        if (error instanceof HttpError) {
            if (error.status === 401) {
                if (type === 'Token') {
                    toast.error(`落雪数据源更新失败: token无效`, { position: "top-center" });
                } else {
                    toast.error(`落雪数据源更新失败: token失效`, { position: "top-center" });
                    cleanLXNSOAuth();
                }
            } else {
                toast.error(`落雪数据源更新失败 : ${error.message}`, { position: "top-center" })
            }
        } else {
            toast.error("落雪数据源更新失败", { position: "top-center" })
        }
        console.error(error);
        if (type === 'Token') ErrorCount.value++;
        if (ErrorCount.value >= MAX_ERROR_COUNT && OAuthStore.hasCredentials("lxns") && type === 'Token') {
            toast.warning("错误次数过多,已为你删除缓存凭证")
            OAuthStore.removeCredentials("lxns")
        }
    } finally {
        DataSourceUpdating.value = false
    }
}

// 点击更新按钮
const handelLXNSDialog = async () => {
    if (hasLXNSOAuth.value) {
        DataSourceUpdating.value = true
        if (isAccessTokenExpired()) {
            if (isRefreshTokenExpired()) {
                cleanLXNSOAuth();
                toast.error("OAuth已过期，请用token更新或者重新申请", { position: "top-center" })
                cardRef.value?.openDialog()
                DataSourceUpdating.value = false;
                return;
            }
            const b = await getLXNSToken('', 'refresh');
            if (!b) {
                cardRef.value?.openDialog()
                DataSourceUpdating.value = false;
                return;
            }
        }
        const bearerToken = `Bearer ${LXNSOAuth.value.access_token}`
        toast.info("使用OAuth更新中~")
        await updateLXNSDataSource(bearerToken, 'OAuth')
    } else {
        if (OAuthStore.hasCredentials("lxns")) {
            await updateLXNSDataSource(OAuthStore.DataSourceCredentials.lxns, 'Token')
        } else {
            cardRef.value?.openDialog()
        }
    }
}

// Dialog 提交时触发（Token 模式）
const handleDialogSubmit = async (credentials: string, remember: boolean) => {
    lxnsToken.value = credentials
    await updateLXNSDataSource(credentials, 'Token', remember)
}

// OAuth 授权码提交
const submitOAuthCode = async () => {
    DataSourceUpdating.value = true
    const b = await getLXNSToken(oauthCode.value, 'query');
    if (!b) { DataSourceUpdating.value = false; return };
    const bearerToken = `Bearer ${LXNSOAuth.value.access_token}`
    toast.info("使用OAuth更新中~")
    await updateLXNSDataSource(bearerToken, 'OAuth')
}

const handelUseOAuth = () => {
    cardRef.value?.closeDialog()
    showLxnsOAuthDialog.value = true;
    oauthCode.value = ''
}
</script>