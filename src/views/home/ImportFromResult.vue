<template>
    <Dialog v-model:open="open">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>将搜索结果导入到合集当中</DialogTitle>
                <DialogDescription>
                    <p v-if="props.list.length >= props.max_limit" class="text-red-600">
                        注意：当前歌曲数量超过建议值 ({{ props.max_limit }}) 这也许并非期望导入,请检查条件是否过于充分</p>
                    <p>准备导入的歌曲数量为 : {{ props.list.length }}</p>
                </DialogDescription>
            </DialogHeader>
            <div class="flex flex-col gap-4">
                <div v-if="!hasTargetScoreTag">
                    <Label class="block font-bold text-gray-700 mb-2">
                        筛选难度
                    </Label>
                    <MultiSelectTags :options="diffOptions" :selected="selectedDiffs"
                        @selection-change="(selected: any) => selectedDiffs = selected" placeholder="请选择难度，留空默认为紫谱">
                        <template #option-item="{ option }">
                            <div class="flex justify-between items-center gap-1">
                                <div :class="getLevelClass(option.value)"></div>
                                <span>{{ option.label }}</span>
                            </div>
                        </template>
                        <template #selected-item="{ item }">
                            <div class="flex justify-between items-center gap-1">
                                <div :class="getLevelClass(item.value)"></div>
                                <span>{{ item.label }}</span>
                            </div>
                        </template>
                    </MultiSelectTags>
                </div>
                <div>
                    <Label class="block font-bold text-gray-700 mb-2">
                        选择导入的合集<span class="text-xs text-muted-foreground">(这会覆盖原有合集内的成绩)</span>
                    </Label>
                    <Select :disabled="UserCollectionList.length === 0" v-model:model-value="selectedCollection">
                        <SelectTrigger class="w-48">
                            <SelectValue placeholder="请选择需要选择的列表" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectLabel>合集列表</SelectLabel>
                            <SelectItem :value="ds.label" v-for="ds in UserCollectionList" :key="ds.label">
                                {{ ds.label }}
                            </SelectItem>
                            <SelectItem :disabled="true" v-if="UserCollectionList.length === 0" value="empty">
                                一个合集都没有呀
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="w-full">
                    <Label class="block font-bold text-gray-700 mb-2">
                        查看导入的歌曲列表
                    </Label>
                    <VirtualSelectViewer :items="props.list" :placeholder="`查看 ${props.list.length} 首歌曲`"
                        :item-height="56">
                        <template #item="{ item }">
                            <div class="flex items-center gap-2 p-2 hover:bg-accent rounded-md w-full">
                                <div class="flex flex-col w-full">
                                    <span class="font-semibold truncate">{{ item.title }}</span>
                                    <span class="text-xs text-muted-foreground">{{ item.artist }}</span>
                                </div>
                            </div>
                        </template>
                    </VirtualSelectViewer>
                </div>
            </div>
            <DialogFooter class="gap-4 lg:gap-2">
                <Button type="button" variant="outline" @click="open = false">
                    取消
                </Button>
                <Button type="submit" @click="handelImport" :disabled="Importing">
                    导入！
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { SelectItem, SelectLabel, SelectTrigger, Select, SelectValue, SelectContent } from '@/components/shadcn/ui/select'
import MultiSelectTags from '@/components/MultiSelectTags.vue'
import { Button } from '@/components/shadcn/ui/button';
import { Label } from 'reka-ui';
import type { MaiMaiSong } from '@/types/songs';
import type { TagOption } from '@/components/TagInputCombobox.vue';
import { computed, ref } from 'vue';
import { LEVEL_MATCH_PATTEN, LEVEL_RANGE_MATCH_PATTEN } from '@/utils/StrUtil';
import type { FilterProps } from '@/types/component';
import { storeToRefs } from 'pinia';
import { useCollectionStore } from '@/store/collections';
import { toast } from 'vue-sonner';
import VirtualSelectViewer from '@/components/VirtualSelectViewer.vue';
import { filterDiffByTag } from '@/utils/functionUtil';

const { UserCollectionList } = storeToRefs(useCollectionStore())

const open = defineModel("open", {
    default: false,
    type: Boolean
})
const diffOptions: FilterProps<number>[] = [{ label: 'BASIC', value: 0 }, { label: 'ADVANCED', value: 1 }, { label: 'EXPERT', value: 2 }, { label: 'MASTER', value: 3 }, { label: 'Re:MASTER', value: 4 }, { label: 'U•TA•GE', value: -1 }];
const selectedDiffs = ref<FilterProps<number>[]>([])
const props = defineProps<{
    list: MaiMaiSong[] | []
    tagOption: TagOption,
    max_limit: number
}>()
const hasLevelTag = computed(() => {
    return props.tagOption.tags.filter(t => LEVEL_MATCH_PATTEN.test(t.value) || LEVEL_RANGE_MATCH_PATTEN.test(t.value)).length > 0
})
const hasAchievementTag = computed(() => {
    return props.tagOption.tags.filter(t => t.needDs ?? false).length > 0
})
// 标签过滤了一些特定的难度|成绩，例如指定鸟加、达成率在一定范围内的、或者需要满足定数需求的
const hasTargetScoreTag = computed(() => {
    return hasLevelTag.value || hasAchievementTag.value
})
const selectedCollection = ref<string>("")
const getLevelClass = (level_index: number) => {
    const base = `rounded-full w-4 h-4`;
    switch (level_index) {
        case 0: return `${base} bg-BASIC`;
        case 1: return `${base} bg-ADVANCED`;
        case 2: return `${base} bg-EXPERT`;
        case 3: return `${base} bg-MASTER`;
        case 4: return `${base} bg-REMASTER`;
        case -1: return `${base} bg-UTAGE`;
    }
}
const Importing = ref(false)
const handelImport = () => {
    if (!selectedCollection.value || selectedCollection.value.length === 0) {
        toast.warning("请选择需要导入的合集", { position: "top-center" })
        return;
    }
    if (Importing.value) return
    Importing.value = true
    const index = UserCollectionList.value.findIndex(c => c.label === selectedCollection.value);
    if (index === -1) {
        toast.error("未找到目标合集", { position: "top-center" }); return;
    }
    const DefaultLevel = selectedDiffs.value.length === 0 && !hasLevelTag.value;
    const diffList: string[] = []
    for (const song of props.list) {
        if (DefaultLevel) {
            Array.prototype.push.apply(diffList, getScoreId(song, [3, 4]))
            continue;
        }
        const targetLevels = selectedDiffs.value.map(diff => diff.value)
        Array.prototype.push.apply(diffList, getScoreId(song, targetLevels))
    }
    UserCollectionList.value[index].list = new Set<string>(diffList)
    toast.success(`导入成功,导入了${diffList.length}个成绩(难度)`, { position: "top-center" })
    Importing.value = false;
    open.value = false
}
const getScoreId = (song: MaiMaiSong, targetLevels: number[]) => {
    const diffs = [...song.difficulties.standard, ...song.difficulties.dx]
    let filteredDiffs = diffs.filter(diff =>
        filterDiffByTag(props.tagOption, diff, song.id)
        && targetLevels.includes(diff.level_index)
    );
    return filteredDiffs.map(diff => {
        const diff_id = ("diff_id" in diff) ? diff.diff_id : song.id;
        return `${diff_id}_${diff.type}_${diff.level_index}`
    })
}
</script>