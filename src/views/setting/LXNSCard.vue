<template>
    <div>
        <!-- 落雪数据源 -->
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Snowflake class="h-5 w-5" />
                        <div>
                            <span>落雪数据源 </span>
                            <span class="block md:inline">{{ selectedSource === 'lxns' ? '(当前默认数据源)' : '' }}</span>
                        </div>

                    </div>
                    <div v-if="hasLXNSData" class="flex gap-4">
                        <Button variant="outline" @click="exportLXNSData">
                            导出
                        </Button>
                        <ActionConfirm title="你确定要删除该数据源吗?" confirm-text="删除" cancel-text="保留"
                            @confirm="ClearDataSource('lxns')">
                            <Button variant="destructive">
                                删除
                            </Button>
                        </ActionConfirm>
                    </div>
                </CardTitle>
                <CardDescription>
                    管理落雪成绩的同步和更新
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <p class="text-sm font-medium">最后更新时间</p>
                        <p class="text-sm text-muted-foreground">
                            {{ formatDate(getLXNSScoreList.value.update_time) }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <Button v-if="hasLXNSData && selectedSource !== 'lxns'" variant="outline"
                            @click="() => switchDataSource('lxns')" :disabled="!hasLXNSData">
                            设为默认
                        </Button>
                        <Button @click="handelLXNSDialog" :disabled="DataSourceUpdating" class="gap-2">
                            <RefreshCw :class="{ 'animate-spin': DataSourceUpdating }" class="h-4 w-4" />
                            <span>{{ DataSourceUpdating ? '更新中...' : '更新' }}</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
        <!-- 落雪Token对话框 -->
        <Dialog v-model:open="showLxnsDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>落雪数据源认证</DialogTitle>
                    <DialogDescription>
                        <p>请输入您的落雪账号个人 API 密钥。可前往<a class="text-blue-600 hover:underline"
                                href="https://maimai.lxns.net/user/profile" target="_blank">账号详情</a>生成。</p>
                        <p>或者尝试下使用OAuth登录 <a @click="handelUseOAuth" class="text-blue-600 hover:underline"
                                :href="LXNS_OAUTH_URI" target="_blank">使用OAuth</a></p>
                    </DialogDescription>
                </DialogHeader>
                <form @submit.prevent="updateLXNSDataSource('Token')" class="space-y-4 pt-4">
                    <div class="space-y-2">
                        <Label for="lxns-token">API密钥</Label>
                        <Input id="lxns-token" v-model="lxnsCredentials" placeholder="个人 API 密钥" required />
                    </div>
                    <DialogFooter class="gap-4 lg:gap-2">
                        <Button type="button" variant="outline" @click="showLxnsDialog = false">
                            取消
                        </Button>
                        <Button type="submit" :disabled="DataSourceUpdating">
                            {{ DataSourceUpdating ? '更新中...' : '确认更新' }}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
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
                        <Label for="lxns-token">授权码</Label>
                        <Input id="lxns-token" v-model="lxnsCredentials" placeholder="落雪OAuth授权码" required />
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
import { Button } from '@/components/shadcn/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { ref } from 'vue';
import { RefreshCw, Snowflake } from 'lucide-vue-next'
import { useDataStore } from '@/store/datasource';
import { toast } from 'vue-sonner';
import { formatDate } from '@/utils/StrUtil';
import { useOAuthStore } from '@/store/oauth';
import { useCopyHelper } from '@/utils/functionUtil';
import LXNSService, { type LXNSAuthType } from '@/api/lxns'
import { storeToRefs } from 'pinia'
import ActionConfirm from '@/components/ActionConfirm.vue'
import { HttpError } from '@/api/base'
const DataSourceUpdating = ref(false)
const showLxnsDialog = ref(false)
const showLxnsOAuthDialog = ref(false)
const lxnsCredentials = ref("")
const LXNS_OAUTH_URI = import.meta.env.VITE_LXNS_OAUTH_URI
const {
    exportLXNSData,
    switchDataSource,
    updateLXNSData,
    ClearDataSource
} = useDataStore();
const { getLXNSScoreList, hasLXNSData, selectedSource } = storeToRefs(useDataStore())
const { isAccessTokenExpired, isRefreshTokenExpired, getLXNSToken, cleanLXNSOAuth } = useOAuthStore();
const { hasLXNSOAuth, LXNSOAuth } = storeToRefs(useOAuthStore())
const { handelCopy } = useCopyHelper()


// 更新落雪数据源
const updateLXNSDataSource = async (type: LXNSAuthType = 'Token') => {
    if (!lxnsCredentials.value) {
        toast.error(`请填写您的落雪${type === 'Token' ? '账号个人 API 密钥' : 'OAuth授权码'}`)
        return
    }
    DataSourceUpdating.value = true
    try {
        const result = await LXNSService.queryDataFromLXNS(lxnsCredentials.value, type)
        if (result) {
            if (result.success) {
                //存入数据
                updateLXNSData(result.data)
                toast.success('落雪数据源更新成功！')
                // 关闭对话框
                showLxnsDialog.value = false
                showLxnsOAuthDialog.value = false
                // 清空表单
                lxnsCredentials.value = ''
            } else {
                toast.error(`落雪数据源更新失败 code:${result.code}`)
                console.error("落雪数据源更新失败", result);
            }
        } else toast.error('落雪数据源更新失败,返回的数据源为空')
    } catch (error: any) {
        if (error instanceof HttpError) {
            if (error.status === 401) {
                if (type === 'Token') {
                    toast.error(`落雪数据源更新失败: token无效`, { position: "top-center" });
                } else {
                    toast.error(`落雪数据源更新失败: token失效`, { position: "top-center" });
                    //clean up auth info
                    cleanLXNSOAuth();
                }
            } else {
                toast.error(`落雪数据源更新失败 : ${error.message}`, { position: "top-center" })
            }
        } else {
            toast.error("落雪数据源更新失败", { position: "top-center" })
        }
        console.error(error);
    } finally {
        DataSourceUpdating.value = false
    }
}
//handler
const handelLXNSDialog = async () => {
    //如果有OAuth则尝试通过OAuth更新
    if (hasLXNSOAuth.value) {
        DataSourceUpdating.value = true
        //check acc expire
        if (isAccessTokenExpired()) {
            if (isRefreshTokenExpired()) {
                //clean up auth info
                cleanLXNSOAuth();
                toast.error("OAuth已过期，请用token更新或者重新申请", { position: "top-center" })
                showLxnsDialog.value = true
                DataSourceUpdating.value = false;
                return;
            }
            //refresh token
            const b = await getLXNSToken(lxnsCredentials.value, 'refresh');
            if (!b) {
                showLxnsDialog.value = true
                DataSourceUpdating.value = false;
                return;
            }
        }
        //update with oauth
        lxnsCredentials.value = `Bearer ${LXNSOAuth.value.access_token}`
        toast.info("使用OAuth更新中~")
        await updateLXNSDataSource('OAuth')
    } else {
        showLxnsDialog.value = true
    }
}
const submitOAuthCode = async () => {
    DataSourceUpdating.value = true
    const b = await getLXNSToken(lxnsCredentials.value, 'query');
    if (!b) { DataSourceUpdating.value = false; return };
    lxnsCredentials.value = `Bearer ${LXNSOAuth.value.access_token}`
    toast.info("使用OAuth更新中~")
    await updateLXNSDataSource('OAuth')
}
const handelUseOAuth = () => {
    showLxnsDialog.value = false;
    showLxnsOAuthDialog.value = true;
    lxnsCredentials.value = ''
}

</script>