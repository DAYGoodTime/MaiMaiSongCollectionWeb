<template>
    <Dialog v-model:open="showOpen">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{{ title }}</DialogTitle>
                <DialogDescription>
                    {{ description }}
                    <p v-if="ScoreStore.getSelectableSource.length == 0" class="text-red-600 font-bold">
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
                    <LevelRangeSelector v-model:model-value="levelRange" />
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
import { useCollectionStore } from '@/store/collections';
import { toast } from 'vue-sonner';
import { ref } from 'vue'
import MultiSelectTags from '@/components/MultiSelectTags.vue'
import type { FilterProps } from '@/types/component'
import { storeToRefs } from 'pinia'
import { useScores } from '@/store/datasources/scores'
import { useSongStore } from '@/store/datasources/song'
import LevelRangeSelector from './LevelRangeSelector.vue'

interface LevelRange {
    start: number
    end: number
}
const { title, description } = defineProps({
    title: {
        type: String,
        default: "自动导入对应定数"
    },
    description: {
        type: String,
        default: "可以选择定数范围，自动导入定速范围内的成绩。"
    }
})
const showOpen = defineModel<boolean>("open")
const levelRange = ref<[number, number]>([12.0, 15.0])
const ScoreStore = useScores()
const SongStore = useSongStore()
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
    const song_list = SongStore.getSongList();
    const result_score = new Set<string>([])
    const coll_index = UserCollectionList.value.findIndex(c => c.label == CurrentCollectionLabel.value);
    const ranges = selectedLevelRanges.value.map(prop => [prop.value.start, prop.value.end]);
    console.log("range", levelRange.value);

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