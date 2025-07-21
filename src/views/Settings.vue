<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight">设置</h1>
            <p class="text-muted-foreground mt-2">管理数据源和系统配置</p>
            <p v-if="appStore.hasUserName" class="mt-2">欢迎回来：<span class="font-semibold">{{ appStore.UserName
            }}</span></p>
        </div>

        <div class="space-y-6">
            <!-- 歌曲数据源 -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center gap-2">
                        <Music class="h-5 w-5" />
                        <span>歌曲数据源</span>
                    </CardTitle>
                    <CardDescription>
                        管理歌曲数据的同步和更新
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="flex items-center justify-between">
                        <div class="space-y-1">
                            <p class="text-sm font-medium">最后更新时间</p>
                            <p class="text-sm text-muted-foreground">
                                {{ formatDate(getSongDataList.update_time) }}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- 水鱼数据源 -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Fish class="h-5 w-5" />
                            <span>水鱼数据源</span>
                        </div>
                        <Button variant="outline" :disabled="!hasDivingFishData" @click="exportDivingFishData">
                            {{ hasDivingFishData ? '导出' : '无数据' }}
                        </Button>
                    </CardTitle>
                    <CardDescription>
                        管理水鱼成绩的同步和更新
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="flex items-center justify-between">
                        <div class="space-y-1">
                            <p class="text-sm font-medium">最后更新时间</p>
                            <p class="text-sm text-muted-foreground">
                                {{ formatDate(getDivingFishScoreList.update_time) }}
                            </p>
                        </div>
                        <Button @click="showFishDialog = true" :disabled="DataSourceUpdating.divingFish" class="gap-2">
                            <RefreshCw :class="{ 'animate-spin': DataSourceUpdating.divingFish }" class="h-4 w-4" />
                            <span>{{ DataSourceUpdating.divingFish ? '更新中...' : '更新' }}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <!-- 落雪数据源 -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <Snowflake class="h-5 w-5" />
                            <span>落雪数据源</span>
                        </div>
                        <Button variant="outline" :disabled="!hasLXNSData" @click="exportLXNSData">
                            {{ hasLXNSData ? '导出' : '无数据' }}
                        </Button>
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
                                {{ formatDate(getLXNSScoreList.update_time) }}
                            </p>
                        </div>
                        <Button @click="showLxnsDialog = true" :disabled="DataSourceUpdating.lxns" class="gap-2">
                            <RefreshCw :class="{ 'animate-spin': DataSourceUpdating.lxns }" class="h-4 w-4" />
                            <span>{{ DataSourceUpdating.lxns ? '更新中...' : '更新' }}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <!-- 合集和留言数据 -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <MessageSquare class="h-5 w-5" />
                            <span>合集和留言数据</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <Button variant="outline" @click="exportCollectionData">
                                导出
                            </Button>
                            <Button variant="outline" :disabled="DataSourceUpdating.collDataUpload"
                                @click="uploadCollData">
                                {{ DataSourceUpdating.collDataUpload ? '上传中...' : '上传' }}
                            </Button>
                        </div>
                    </CardTitle>
                    <CardDescription>
                        管理合集和留言数据
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="flex items-center justify-end">
                        <Button @click="handelDownloadCollData" :disabled="DataSourceUpdating.collDataDownload"
                            class="gap-2">
                            <RefreshCw :class="{ 'animate-spin': DataSourceUpdating.collDataDownload }"
                                class="h-4 w-4" />
                            <span>{{ DataSourceUpdating.collDataDownload ? '更新中...' : '从云端同步' }}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div class="text-center text-sm text-muted-foreground pt-4">
                版本: {{ getProjectVersion() }}
            </div>
        </div>

        <!-- 对话框 -->
        <Dialog v-model:open="showFishDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>水鱼数据源认证</DialogTitle>
                    <DialogDescription>
                        请输入您的水鱼账号中的成绩导入Token以更新数据源。
                        可前往<a class="text-blue-600 hover:underline"
                            href="https://www.diving-fish.com/maimaidx/prober/#Profile" target="_blank">账号详情</a>获取。
                    </DialogDescription>
                </DialogHeader>
                <form @submit.prevent="updateFishDataSource" class="space-y-4 pt-4">
                    <div class="space-y-2">
                        <Label for="fish-token">成绩导入Token</Label>
                        <Input id="fish-token" v-model="fishCredentials.token" placeholder="请输入成绩导入Token" required />
                    </div>
                    <DialogFooter class="gap-4 lg:gap-2">
                        <Button type="button" variant="outline" @click="showFishDialog = false">
                            取消
                        </Button>
                        <Button type="submit" :disabled="DataSourceUpdating.divingFish">
                            {{ DataSourceUpdating.divingFish ? '更新中...' : '确认更新' }}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <Dialog v-model:open="showLxnsDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>落雪数据源认证</DialogTitle>
                    <DialogDescription>
                        请输入您的落雪账号个人 API 密钥。
                        可前往<a class="text-blue-600 hover:underline" href="https://maimai.lxns.net/user/profile"
                            target="_blank">账号详情</a>生成。
                    </DialogDescription>
                </DialogHeader>
                <form @submit.prevent="updateLXNSDataSource" class="space-y-4 pt-4">
                    <div class="space-y-2">
                        <Label for="lxns-token">API密钥</Label>
                        <Input id="lxns-token" v-model="lnxsCredentials.token" placeholder="个人 API 密钥" required />
                    </div>
                    <DialogFooter class="gap-4 lg:gap-2">
                        <Button type="button" variant="outline" @click="showLxnsDialog = false">
                            取消
                        </Button>
                        <Button type="submit" :disabled="DataSourceUpdating.lxns">
                            {{ DataSourceUpdating.lxns ? '更新中...' : '确认更新' }}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <Dialog v-model:open="showSetNameDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>设置个人标识符</DialogTitle>
                    <DialogDescription>
                        请输入一个名字来标识你的云端数据。这个名字在后续操作中将作为你的唯一身份凭证。
                    </DialogDescription>
                </DialogHeader>
                <form @submit.prevent="updateName" class="space-y-4 pt-4">
                    <div class="space-y-2">
                        <Label for="username-set">用户名</Label>
                        <Input id="username-set" v-model="tempUserName" placeholder="请输入你的用户名" required />
                    </div>
                    <DialogFooter class="gap-4 lg:gap-2">
                        <Button type="button" variant="outline" @click="showSetNameDialog = false">
                            取消
                        </Button>
                        <Button type="submit" :disabled="DataSourceUpdating.name">
                            {{ DataSourceUpdating.name ? '保存中...' : '确认' }}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <Dialog v-model:open="showNameConfirmDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>确认用户名</DialogTitle>
                    <DialogDescription>
                        确认使用用户名 <span class="font-semibold">{{ appStore.UserName }}</span> 来同步云端数据吗？
                        如果需要同步其他用户的数据，你可以在下方输入新的用户名。
                    </DialogDescription>
                </DialogHeader>
                <form @submit.prevent="() => nameCallback.callback()" class="space-y-4 pt-4">
                    <div class="space-y-2">
                        <Label for="username-confirm">用户名</Label>
                        <Input id="username-confirm" v-model="tempUserName" placeholder="请输入用户名" required />
                    </div>
                    <DialogFooter class="gap-4 lg:gap-2">
                        <Button type="button" variant="outline" @click="showNameConfirmDialog = false">
                            取消
                        </Button>
                        <Button type="submit" :disabled="DataSourceUpdating.name">
                            {{ DataSourceUpdating.name ? '处理中...' : '确认' }}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Music, Fish, RefreshCw, Snowflake, MessageSquare } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useDataStore } from '@/store/datasource'
import { useCollectionStore } from '@/store/collections'
import { useAppStore } from '@/store/appStore'
import { getProjectVersion } from '@/utils/StrUtil'

// 响应式数据
const showFishDialog = ref(false)
const showLxnsDialog = ref(false)
const showSetNameDialog = ref(false)
const showNameConfirmDialog = ref(false)
const ENV_HOST = "https://maimai-provider-api.vercel.app"
// const ENV_HOST = "http://localhost:3000/"
const DataSourceUpdating = reactive({
    divingFish: false,
    lxns: false,
    name: false,
    collDataDownload: false,
    collDataUpload: false
})
const fishCredentials = reactive({
    token: ''
})
const lnxsCredentials = reactive({
    token: ''
})
const { exportCollectionData, uploadCollectionData, downloadCollectionData } = useCollectionStore()

const {
    getSongDataList,
    getDivingFishScoreList,
    updateDivingFishData,
    getLXNSScoreList,
    updateLXNSData,
    exportLXNSData,
    hasLXNSData,
    exportDivingFishData,
    hasDivingFishData,
} = useDataStore();

// 格式化日期
const formatDate = (date: Date | string): string => {
    let _date = new Date(date)
    if (isNaN(_date.getTime())) return date as string;
    return _date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// 更新水鱼数据源
const updateFishDataSource = async () => {
    if (!fishCredentials.token) {
        toast.error('请填写水鱼成绩导入Token')
        return
    }

    DataSourceUpdating.divingFish = true

    try {
        let response = await fetch(`${ENV_HOST}/maimai/fish`, {
            method: "GET",
            headers: {
                "authorization": fishCredentials.token
            }
        })
        if (!response.ok) {
            toast.error('请求落雪数据源更新失败')
            return;
        }
        const result = await response.json()
        if (!result.success) {
            toast.error(`落雪数据源更新失败: ${result.message}`)
            return;
        }
        // 关闭对话框
        showFishDialog.value = false
        // 清空表单
        fishCredentials.token = ''
        //存入数据
        updateDivingFishData(result.data.data)
        // 显示成功提示
        toast.success('水鱼数据源更新成功！')
    } catch (error) {
        toast.error('水鱼数据源更新失败，请查看控制台输出')
    } finally {
        DataSourceUpdating.divingFish = false
    }
}
// 更新落雪数据源
const updateLXNSDataSource = async () => {
    if (!lnxsCredentials.token) {
        toast.error('请填写您的落雪账号个人 API 密钥')
        return
    }
    DataSourceUpdating.lxns = true
    try {
        let response = await fetch(`${ENV_HOST}/maimai/lxns`, {
            method: "GET",
            headers: {
                "authorization": lnxsCredentials.token
            }
        })
        if (!response.ok) {
            toast.error('请求落雪数据源更新失败')
            return;
        }
        const result = await response.json()
        if (!result.success) {
            toast.error(`落雪数据源更新失败: ${result.message}`)
            return;
        }

        // 关闭对话框
        showLxnsDialog.value = false
        // 清空表单
        lnxsCredentials.token = ''
        //存入数据
        updateLXNSData(result.data.data)
        // 显示成功提示
        toast.success('落雪数据源更新成功！')
    } catch (error) {
        toast.error('落雪数据源更新失败，请查看控制台输出')
    } finally {
        DataSourceUpdating.lxns = false
    }
}

//upload
const appStore = useAppStore();
const tempUserName = ref("")
const updateName = () => {
    if (tempUserName.value.trim().length === 0) {
        toast.error("请输入用户名");
        return;
    }
    if (tempUserName.value.length > 20) {
        toast.error("用户名太长了");
        return;
    }
    appStore.UserName = tempUserName.value.trim();
    toast.success("用户名更新为:" + tempUserName.value.trim());
    showSetNameDialog.value = false;
    tempUserName.value = ""
}
const uploadCollData = async () => {
    if (!appStore.hasUserName) {
        toast.error("请先设置名称再进行上传", {
            position: "top-center"
        })
        tempUserName.value = ""
        showSetNameDialog.value = true;
        return;
    }
    DataSourceUpdating.collDataUpload = true
    if (await uploadCollectionData(appStore.UserName)) {
        toast.success("上传成功")
    }
    DataSourceUpdating.collDataUpload = false
}
const nameCallback = ref({
    callback: () => { }
})
const handelDownloadCollData = () => {
    if (appStore.hasUserName) {
        tempUserName.value = appStore.UserName;
        showNameConfirmDialog.value = true;
        nameCallback.value = {
            callback: async () => {
                if (tempUserName.value.trim().length === 0) {
                    toast.error("请输入用户名");
                    return;
                }
                if (tempUserName.value.length > 20) {
                    toast.error("用户名太长了");
                    return;
                }
                const name = tempUserName.value.trim();;
                DataSourceUpdating.collDataDownload = true
                DataSourceUpdating.name = true
                const b = await downloadCollectionData(name)
                DataSourceUpdating.collDataDownload = false
                DataSourceUpdating.name = false
                if (b) {
                    toast.success("同步成功")
                    showNameConfirmDialog.value = false;
                    tempUserName.value = ""
                } else {
                    toast.error("同步失败，请确认该用户名是否有数据")
                }
            }
        }
    } else {
        toast.error("请先设置名称再进行上传", {
            position: "top-center"
        })
        showSetNameDialog.value = true;
        return;
    }
}
</script>
