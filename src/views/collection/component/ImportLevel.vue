<template>
    <Dialog v-model:open="showOpen">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>自动导入对应定数</DialogTitle>
                <DialogDescription>
                    可以选择定数范围，自动导入定速范围内的成绩。
                    <p v-if="getSelectableSource.length == 0" class="text-red-600 font-bold">
                        注意:你没有添加任何查分器，所有导入的成绩都是'未游玩'状态，默认不会进行显示！</p>
                </DialogDescription>
            </DialogHeader>
            <div class="flex flex-col gap-4">
                <div>
                    <Label class="block text-sm font-medium text-gray-700 mb-3">
                        选择常见的定数范围
                    </Label>
                    <div class="">
                        <MultiSelectTags :options="commonLevelOptions" :selected="selectedLevelRanges"
                            @selection-change="(selected) => selectedLevelRanges = selected" placeholder="请选择定数范围" />
                    </div>
                </div>
                <div>
                    <Label class="block text-sm font-medium text-gray-700 mb-3">
                        自义定谱面定数范围 <span class="text-xs font-light">滑块可以快速选定常用的定数范围，如果需要其他范围，可以从左右两边手动输入你想要的定数</span>
                    </Label>
                    <div class="flex items-center space-x-4 pt-2">
                        <Input type="number" class="w-12 text-center h-8 text-xs pr-0 pl-1" :step="0.1" :min="1.0"
                            :max="levelRange[1]" v-model:model-value="levelRange[0]" />
                        <Slider v-model:model-value="levelRangeSlider" :min="12.0" :max="15.0" :step="0.1"
                            :show-min-max="false" :show-ticks="true" class="flex-1" />
                        <Input type="number" class="w-12 text-center h-8 text-xs pr-0 pl-1" :step="0.1"
                            :min="levelRange[0]" :max="15.0" v-model:model-value="levelRange[1]" />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" @click="handelImportByLevel" :disabled="importing">
                    {{ importing ? '导入中' : '导入!' }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
<script setup lang="ts">
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/shadcn/ui/dialog'
import { Label } from '@/components/shadcn/ui/label'
import { Button } from '@/components/shadcn/ui/button'
import { Input } from '@/components/shadcn/ui/input'
import Slider from '@/components/shadcn/ui/slider/Slider.vue'
import { useCollectionStore } from '@/store/collections';
import { useDataStore } from '@/store/datasource';
import { toast } from 'vue-sonner';
import { ref, watch } from 'vue'
import MultiSelectTags from '@/components/MultiSelectTags.vue'
import type { FilterProps } from '@/types/component'
import { storeToRefs } from 'pinia'

interface LevelRange {
    start: number
    end: number
}
const showOpen = defineModel<boolean>("open")
const levelRange = ref([12.0, 15.0])
const levelRangeSlider = ref([12.0, 15.0])
watch(levelRangeSlider, (newRange) => {
    const [newMin, newMax] = newRange;
    levelRange.value = [newMin, newMax]
})
const { getSongDataList, getSelectableSource } = storeToRefs(useDataStore())
const { UserCollectionList, CurrentCollectionLabel } = storeToRefs(useCollectionStore());
const commonLevelOptions: FilterProps<LevelRange>[] =
    [
        { label: "12", value: { start: 12.0, end: 12.5 } },
        { label: "12+", value: { start: 12.6, end: 12.9 } },
        { label: "13", value: { start: 13.0, end: 13.5 } },
        { label: "13+", value: { start: 13.6, end: 13.9 } },
        { label: "14", value: { start: 14.0, end: 14.5 } },
        { label: "14+", value: { start: 14.6, end: 14.9 } },
        { label: "15", value: { start: 15.0, end: 15.5 } }
    ]
const selectedLevelRanges = ref<FilterProps<LevelRange>[]>([])
const importing = ref(false)
const handelImportByLevel = () => {
    if (importing.value) return;
    importing.value = true
    const song_list = getSongDataList.value.list;
    const result_score = new Set<string>([])
    const coll_index = UserCollectionList.value.findIndex(c => c.label == CurrentCollectionLabel.value);
    const ranges = selectedLevelRanges.value.map(prop => [prop.value.start, prop.value.end]);
    for (const song of song_list) {
        const difficulties = [...song.difficulties.standard, ...song.difficulties.dx];
        for (const diff of difficulties) {
            //优先筛选常用的
            if (ranges.length >= 1) {
                for (const range of ranges) {
                    if (diff.level_value >= range[0] && diff.level_value <= range[1]) {
                        result_score.add(`${song.id}_${diff.type}_${diff.level_index}`)
                    }
                }
            } else if (diff.level_value >= levelRange.value[0] && diff.level_value <= levelRange.value[1]) {
                result_score.add(`${song.id}_${diff.type}_${diff.level_index}`)
            }
        }
    }
    if (UserCollectionList.value[coll_index]) {
        UserCollectionList.value[coll_index].list = result_score;
        toast.success("导入成功，正在重新加载")
        emit("onScoreListChanged")
    }
    selectedLevelRanges.value = []
    levelRange.value = [12.0, 15.0]
    importing.value = false
    showOpen.value = false
}
const emit = defineEmits(["onScoreListChanged"])
</script>