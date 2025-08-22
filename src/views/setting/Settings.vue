<template>
    <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight">设置</h1>
            <p class="text-muted-foreground mt-2">管理数据源和系统配置</p>
            <p v-if="appStore.hasUserName" class="mt-2">
                欢迎回来：<span class="font-semibold">{{ appStore.UserName }}</span>
            </p>
            <p v-if="Capacitor.getPlatform() === 'web'" class="text-red-600 font-bold">
                因为api的跨域问题，所以数据源(落雪,水鱼)的更新都需要能够访问海外才可以使用
            </p>
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
                        歌曲数据源 (由Usagi提供)
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
            <DivingFIshCard />
            <!-- 落雪数据源 -->
            <LXNSCard />
            <!-- Usagi数据源 -->
            <UsagiCard />
            <!-- 合集和留言数据 -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <MessageSquare class="h-5 w-5" />
                            <span>合集和留言数据</span>
                        </div>
                        <div class="flex items-center gap-4">
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


        <!-- 名称对话框 -->
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
        <!-- 名称确认对话框 -->
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
import { Music, RefreshCw, MessageSquare } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useCollectionStore } from '@/store/collections'
import { useAppStore } from '@/store/appStore'
import { getProjectVersion, formatDate } from '@/utils/StrUtil'
import LXNSCard from './LXNSCard.vue'
import DivingFIshCard from './DivingFIshCard.vue'
import { useDataStore } from '@/store/datasource'
import { Capacitor } from '@capacitor/core'
import UsagiCard from './UsagiCard.vue'

// 响应式数据
const showSetNameDialog = ref(false)
const showNameConfirmDialog = ref(false)
const DataSourceUpdating = reactive({
    name: false,
    collDataDownload: false,
    collDataUpload: false
})
const { exportCollectionData, uploadCollectionData, downloadCollectionData } = useCollectionStore()
const { getSongDataList } = useDataStore();


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
    newNameSet.value = true
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
const newNameSet = ref(false)
const handelDownloadCollData = () => {
    if (appStore.hasUserName) {
        tempUserName.value = appStore.UserName;
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
        //new name not need to confirm
        if (newNameSet.value) {
            nameCallback.value.callback();
        } else {
            showNameConfirmDialog.value = true;
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
