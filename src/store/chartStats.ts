import DivingFishService from "@/api/fish"
import type { DataSource } from "@/types/datasource"
import type { FishChartStat, FishChartStatsResponse, FishDiffData } from "@/types/divingfish"
import { useLocalStorage } from "@vueuse/core"
import { defineStore } from "pinia"
import { computed } from "vue"
import { toast } from "vue-sonner"

export const CURRENT_CHART_STATS_VERSION = 1
export const CURRENT_CHART_DIFF_DATA_VERSION = 1

const DEFAULT_CHART_DS: DataSource<Record<string, FishChartStat[]>> = {
    list: {},
    update_time: '从未获取',
    version: CURRENT_CHART_STATS_VERSION
}
const DEFAULT_DIFF_DS: DataSource<Record<string, FishDiffData>> = {
    list: {},
    update_time: '从未获取',
    version: CURRENT_CHART_STATS_VERSION
}

export const useChartData = defineStore("chart_stats", () => {
    const ChartStats = useLocalStorage('fish_chart_stats', DEFAULT_CHART_DS)
    const DiffData = useLocalStorage('fish_diff_data', DEFAULT_DIFF_DS)
    //init
    if (ChartStats.value.version !== CURRENT_CHART_STATS_VERSION) {
        ChartStats.value = DEFAULT_CHART_DS;
        console.warn("chart data数据不一致,已重置");
    }
    if (DiffData.value.version !== CURRENT_CHART_DIFF_DATA_VERSION) {
        DiffData.value = DEFAULT_DIFF_DS;
        console.warn("chart data数据不一致,已重置");
    }
    const hasChartData = computed(() => {
        return Object.keys(ChartStats.value.list).length > 0
    })
    const hasDiffData = computed(() => {
        return Object.keys(DiffData.value.list).length > 0
    })
    const updateData = async () => {
        try {
            const response = await DivingFishService.queryFishChartData();
            if (Object.keys(response.charts).length === 0) {
                toast.error("水鱼api错误:返回为空")
            }
            handelChartDataUpdate(response)
        } catch (error) {
            toast.error("水鱼api错误")
        }
    }
    const handelChartDataUpdate = (resp: FishChartStatsResponse) => {
        DiffData.value.list = resp.diff_data
        DiffData.value.update_time = new Date();
        ChartStats.value.list = resp.charts
        ChartStats.value.update_time = new Date();
    }
    const getDiffChartData = (fish_id: number | string, level_index: number): FishChartStat | undefined => {
        let song_id = fish_id;
        if (typeof fish_id === 'number')
            song_id = String(fish_id)
        try {
            return ChartStats.value.list[song_id][level_index]
        } catch (_e) {
            return void 0
        }
    }
    return {
        hasChartData,
        hasDiffData,
        updateData,
        ChartStats,
        DiffData,
        getDiffChartData
    }
})