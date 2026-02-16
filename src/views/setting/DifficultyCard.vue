<template>
    <div class="w-full">
        <Card class="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader class="pb-4">
                <CardTitle class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-primary/10">
                            <Tag class="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <span class="text-xl font-semibold text-gray-900">铺面标签状况</span>
                        </div>
                    </div>
                </CardTitle>
                <CardDescription class="text-gray-600 mt-2">
                    统计自己当前数据源下的标签分析，帮助你更好地了解铺面分布情况
                </CardDescription>
            </CardHeader>

            <CardContent class="space-y-6">
                <!-- 筛选器区域 -->
                <div class="space-y-3">
                    <h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <div class="w-1 h-4 bg-primary rounded-full"></div>
                        筛选条件
                    </h3>
                    <div class="w-full rounded-lg border border-gray-200 bg-white p-4">
                        <AdvanceFilter ref="AdvanceFilterRef" :model-value="AdvanceFilterForm" :show-trigger="true"
                            @update:model-value="(filter) => onFilterUpdate(filter as AdvanceFilterFiltersForTag)" />
                    </div>
                </div>

                <!-- 分析结果区域 -->
                <div v-if="AnalysisResult != undefined && AnalysisResult.length !== 0" class="space-y-3">
                    <h3 class="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <div class="w-1 h-4 bg-green-500 rounded-full"></div>
                        分析结果
                    </h3>
                    <div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
                        <DiffTagInfo :tag-info="AnalysisResult" />
                    </div>
                </div>

                <!-- 操作按钮区域 -->
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div class="flex items-center gap-3">
                        <Button @click="onAnalysis" :disabled="isAnalyzing"
                            class="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                            <RefreshCw v-if="isAnalyzing" class="h-4 w-4 mr-2 animate-spin" />
                            <Tag v-else class="h-4 w-4 mr-2" />
                            {{ isAnalyzing ? '分析中...' : '开始分析' }}
                        </Button>

                        <Button variant="outline" @click="onReset"
                            class="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200">
                            重置筛选
                        </Button>
                    </div>
                </div>

                <!-- 空状态提示 -->
                <div v-if="AnalysisResult !== undefined && AnalysisResult.length === 0"
                    class="text-center py-12 text-gray-500">
                    <Tag class="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p class="text-lg font-medium mb-2">暂无分析结果</p>
                    <p class="text-sm">请调整筛选条件后重新分析</p>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { RefreshCw, Tag } from 'lucide-vue-next'
import { analysisTag, type AdvanceFilterFiltersForTag } from '@/utils/tagUtils'
import AdvanceFilter from '@/components/AdvanceFilter/AdvanceFilter.vue'
import { useScores } from '@/store/datasources/scores'
import type { DiffTAG, GroupInfo, GroupInfoForCounter, TAGGroup } from '@/types/tag'
import { ref } from 'vue'
import DiffTagInfo from '@/components/DiffTagInfo.vue'


const DataSourceStore = useScores()

const AdvanceFilterForm = ref<AdvanceFilterFiltersForTag>({
    difficulty: [],
    musicCategories: [],
    version: [],
    mapCategories: [],
    difficultyRange: [1.0, 15.0],
    dxScore: [],
    fullCombo: [],
    fullSync: [],
    Type: [],
    showUnplayed: false,
    achievement_range: [100, 101]
})

const AnalysisResult = ref<GroupInfoForCounter[]>();
const isAnalyzing = ref(false);

const onAnalysis = async () => {
    isAnalyzing.value = true;
    try {
        // 添加一个小延迟来显示加载状态
        await new Promise(resolve => setTimeout(resolve, 300));
        const result = analysisTag(DataSourceStore.getScoreEXList(), AdvanceFilterForm.value)
        console.log("analysis result:", result);
        AnalysisResult.value = result;
    } finally {
        isAnalyzing.value = false;
    }
}

const onFilterUpdate = (filter: AdvanceFilterFiltersForTag) => {
    AdvanceFilterForm.value = filter;
}

const onReset = () => {
    AdvanceFilterForm.value = {
        difficulty: [],
        musicCategories: [],
        version: [],
        mapCategories: [],
        difficultyRange: [1.0, 15.0],
        dxScore: [],
        fullCombo: [],
        fullSync: [],
        Type: [],
        showUnplayed: false,
        achievement_range: [100, 101]
    };
    AnalysisResult.value = undefined;
}
</script>