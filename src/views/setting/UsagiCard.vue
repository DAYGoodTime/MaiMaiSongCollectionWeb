<template>
    <div>
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <img :src="usagiLogo" class="h-5 w-5" />
                        <div>
                            <span>UsagiCard(兔卡) </span>
                            <span class="block md:inline">{{ selectedSource === 'usagi' ? '(当前默认数据源)' : ''
                            }}</span>
                        </div>
                    </div>
                    <div v-if="hasUsagiData" class="flex gap-4">
                        <Button variant="outline" @click="exportUsagiData">
                            导出
                        </Button>
                        <ActionConfirm title="你确定要删除该数据源吗?" confirm-text="删除" cancel-text="保留"
                            @confirm="ClearDataSource('usagi')">
                            <Button variant="destructive">
                                删除
                            </Button>
                        </ActionConfirm>
                    </div>

                </CardTitle>
                <CardDescription>
                    管理UsagiCard成绩的同步和更新
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <p class="text-sm font-medium">最后更新时间</p>
                        <p class="text-sm text-muted-foreground">
                            {{ formatDate(getUsagiScoreList.value.update_time) }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <Button v-if="hasUsagiData && selectedSource !== 'usagi'" variant="outline"
                            @click="() => switchDataSource('usagi')" :disabled="!hasUsagiData">
                            设为默认
                        </Button>
                        <Button @click="handelUpdate" :disabled="DataSourceUpdating" class="gap-2">
                            <RefreshCw :class="{ 'animate-spin': DataSourceUpdating }" class="h-4 w-4" />
                            <span>{{ DataSourceUpdating ? '更新中...' : '更新' }}</span>
                        </Button>
                    </div>

                </div>
            </CardContent>
        </Card>
        <!-- Usagi对话框 -->
        <Dialog v-model:open="showUsagiDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>UsagiCard数据源认证</DialogTitle>
                    <DialogDescription>
                        请输入您的UsagiCard账号中的UUID以更新数据源。
                        <p><a class="text-blue-600 hover:underline" href="https://uc.turou.fun/"
                                target="_blank">Usagi主页</a></p>
                    </DialogDescription>
                </DialogHeader>
                <form @submit.prevent="updateData" class="space-y-4 pt-4">
                    <div class="space-y-2">
                        <Label for="fish-token">卡片uuid</Label>
                        <Input id="fish-token" v-model="Credentials" placeholder="请输入UsagiCard的UUID" required
                            :disabled="DataSourceUpdating" />
                    </div>
                    <div class="flex items-center gap-2">
                        <Checkbox id="remember" v-model="remember" />
                        <Label for="remember">记住凭证(保存在本地)</Label>
                    </div>
                    <DialogFooter class="gap-4 lg:gap-2">
                        <Button type="button" variant="outline" @click="showUsagiDialog = false">
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
import usagiLogo from '@/assets/usagi_logo.ico';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { RefreshCw } from 'lucide-vue-next'
import { Checkbox } from "@/components/shadcn/ui/checkbox";
import { formatDate } from '@/utils/StrUtil';
import { MAX_ERROR_COUNT, useDataStore } from '@/store/datasource'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { storeToRefs } from 'pinia'
import ActionConfirm from '@/components/ActionConfirm.vue'
import UsagiService from '@/api/usagi';
const {
    updateUsagiData,
    exportUsagiData,
    switchDataSource,
    ClearDataSource,
    removeCredentials,
    hasCredentials
} = useDataStore();
const { getUsagiScoreList, hasUsagiData, selectedSource, DataSourceCredentials } = storeToRefs(useDataStore())
const DataSourceUpdating = ref(false)
const showUsagiDialog = ref(false)
const Credentials = ref('')
const ErrorCount = ref(0)
const remember = ref(false)

const handelUpdate = async () => {
    if (hasCredentials("usagi")) {
        //尝试直接更新
        Credentials.value = DataSourceCredentials.value.usagi;
        await updateData();
    } else {
        showUsagiDialog.value = true;
    }
}

// 更新Usagi数据源
const updateData = async () => {
    if (!Credentials.value) {
        toast.error('请填写UsagiCard的uuid', { position: "top-center" })
        return
    }
    DataSourceUpdating.value = true
    try {
        const result = await UsagiService.queryUsagiUserScore(Credentials.value)
        if (result) {
            updateUsagiData(result)
            // 显示成功提示
            toast.success('Usagi数据源更新成功！')
            if (showUsagiDialog.value && remember.value) {
                //保存凭证
                DataSourceCredentials.value.usagi = Credentials.value
            }
            // 关闭对话框
            showUsagiDialog.value = false
            // 清空表单
            Credentials.value = ''
        } else toast.error('Usagi数据源更新失败,返回的数据源为空', { position: "top-center" });
    } catch (error) {
        ErrorCount.value++;
        toast.error('Usagi数据源更新失败', { position: "top-center" })
        console.error(error);
        if (ErrorCount.value >= MAX_ERROR_COUNT && hasCredentials("usagi")) {
            toast.warning("错误次数过多,已为你删除缓存凭证")
            removeCredentials("usagi")
        }
    } finally {
        DataSourceUpdating.value = false
    }
}
</script>
