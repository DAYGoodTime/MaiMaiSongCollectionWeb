<template>
    <Dialog v-model:open="showOpen">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>自动导入对应定数</DialogTitle>
                <DialogDescription>
                    可以选择定数范围，自动导入定速范围内的成绩。
                </DialogDescription>
            </DialogHeader>
            <div>
                <Label class="block text-sm font-medium text-gray-700 mb-3">
                    筛选谱面定数
                </Label>
                <div class="flex items-center space-x-4 pt-2">
                    <Input type="number" :step="0.1" :min="1.0" :max="levelRange[1]"
                        class="w-12 text-center h-8 text-xs pr-0 pl-1" :model-value="levelRange[0].toFixed(1)" />
                    <Slider v-model:model-value="levelRange" :min="12.0" :max="15.0" :step="0.1" :show-min-max="false"
                        :show-ticks="true" class="flex-1" />
                    <Input type="number" :step="0.1" :min="levelRange[0]" :max="15.0"
                        class="w-12 text-center h-8 text-xs pr-0 pl-1" :model-value="levelRange[1].toFixed(1)" />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" @click="handelImportByLevel">
                    导入!
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
import { ref } from 'vue'

const showOpen = defineModel<boolean>("open")
const levelRange = ref([1.0, 15.0])
const { getSongDataList } = useDataStore()
const { UserCollectionList, CurrentCollectionLabel } = useCollectionStore();
const handelImportByLevel = () => {
    const song_list = getSongDataList.list;
    const result_score = new Set<string>([])
    const coll_index = UserCollectionList.findIndex(c => c.label == CurrentCollectionLabel);
    for (const song of song_list) {
        const difficulties = [...song.difficulties.standard, ...song.difficulties.dx];
        for (const diff of difficulties) {
            if (diff.level_value >= levelRange.value[0] && diff.level_value <= levelRange.value[1]) {
                result_score.add(`${song.id}_${diff.type}_${diff.level_index}`)
            }
        }
    }
    if (UserCollectionList[coll_index]) {
        UserCollectionList[coll_index].list = result_score;
        toast.success("导入成功，正在重新加载")
        emit("onScoreListChanged")
    }
    showOpen.value = false
}
const emit = defineEmits(["onScoreListChanged"])
</script>