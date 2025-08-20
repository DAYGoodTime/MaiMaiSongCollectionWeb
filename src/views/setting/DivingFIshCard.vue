<template>
    <div>
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
                            {{ formatDate(getDivingFishScoreList.value.update_time) }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <Button variant="outline" @click="() => switchDataSource('divingfish')"
                            :disabled="!hasDivingFishData || selectedSource === 'divingfish'">
                            设为默认
                        </Button>
                        <Button @click="showFishDialog = true" :disabled="DataSourceUpdating" class="gap-2">
                            <RefreshCw :class="{ 'animate-spin': DataSourceUpdating }" class="h-4 w-4" />
                            <span>{{ DataSourceUpdating ? '更新中...' : '更新' }}</span>
                        </Button>
                    </div>

                </div>
            </CardContent>
        </Card>
        <!-- 水鱼对话框 -->
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
                        <Input id="fish-token" v-model="fishCredentials" placeholder="请输入成绩导入Token" required />
                    </div>
                    <DialogFooter class="gap-4 lg:gap-2">
                        <Button type="button" variant="outline" @click="showFishDialog = false">
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Fish, RefreshCw } from 'lucide-vue-next'
import { formatDate } from '@/utils/StrUtil';
import { useDataStore } from '@/store/datasource'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { queryFishUserScores } from '@/api/fish'
import { storeToRefs } from 'pinia'
const {
    updateDivingFishData,
    exportDivingFishData,
    switchDataSource
} = useDataStore();
const { getDivingFishScoreList, hasDivingFishData, selectedSource } = storeToRefs(useDataStore())
const DataSourceUpdating = ref(false)
const showFishDialog = ref(false)
const fishCredentials = ref('')

// 更新水鱼数据源
const updateFishDataSource = async () => {
    if (!fishCredentials.value) {
        toast.error('请填写水鱼成绩导入Token')
        return
    }
    DataSourceUpdating.value = true
    try {
        const response = await queryFishUserScores(fishCredentials.value)
        if (!response.success) {
            toast.error('请求水鱼数据源更新失败' + response.message, { position: "top-center" })
            return;
        }
        const result = response.response
        // 关闭对话框
        showFishDialog.value = false
        // 清空表单
        fishCredentials.value = ''
        if (result) {
            updateDivingFishData(result.records)
            // 显示成功提示
            toast.success('水鱼数据源更新成功！')
        }
    } catch (error) {
        toast.error('水鱼数据源更新失败，请查看控制台输出')
        console.error(error);
    } finally {
        DataSourceUpdating.value = false
    }
}
</script>
