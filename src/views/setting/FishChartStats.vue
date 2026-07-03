<template>
    <div class="w-full">
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Fish class="h-5 w-5" />
                        <div>
                            <span>水鱼铺面拟合定数数据</span>
                        </div>
                    </div>
                    <!-- <div v-if="hasData" class="flex gap-4">
                        <Button variant="outline" @click="emit('export')">
                            导出
                        </Button>
                        <ActionConfirm title="你确定要删除该数据源吗?" confirm-text="删除" cancel-text="保留"
                            @confirm="emit('delete')">
                            <Button variant="destructive">
                                删除
                            </Button>
                        </ActionConfirm>
                    </div> -->
                </CardTitle>
                <CardDescription>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <p class="text-sm font-medium">最后更新时间</p>
                        <p class="text-sm text-muted-foreground">
                            {{ formatDate(ChartDataStore.ChartStats.update_time) }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <Button @click="handelUpdate" :disabled="isUpdating" class="gap-2">
                            <RefreshCw :class="{ 'animate-spin': isUpdating }" class="h-4 w-4" />
                            <span>{{ isUpdating ? '更新中...' : '更新' }}</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button'
import { RefreshCw } from 'lucide-vue-next'
import { Fish } from 'lucide-vue-next'
import { useChartData } from '@/store/chartStats';
import { formatDate } from '@/utils/StrUtil';
import { ref } from 'vue';

const ChartDataStore = useChartData();
const isUpdating = ref(false)
const handelUpdate = async () => {
    if (isUpdating.value) return
    isUpdating.value = true
    ChartDataStore.updateData();
    setTimeout(() => {
        isUpdating.value = false;
    }, 200)

}   
</script>