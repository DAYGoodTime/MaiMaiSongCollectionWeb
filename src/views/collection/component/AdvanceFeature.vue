<template>
    <Sheet v-model:open="showOpen">
        <SheetContent>
            <SheetHeader>
                <SheetTitle>高级选项</SheetTitle>
                <SheetDescription>
                    这里有一些自动化操作，未来可能会逐步添加
                </SheetDescription>
            </SheetHeader>
            <div class="flex-1 my-4">
                <div>
                    <p class="font-semibold">自动导入</p>
                    <span class="text-sm text-gray-600">根据预先设定的逻辑进行成绩的筛选导入</span><span
                        class="text-sm text-red-600">且会覆盖合集原来的数据</span>
                    <div class="flex justify-center gap-4 mt-2">
                        <Button @click="lazy_master_13">全13</Button>
                    </div>
                </div>
            </div>
            <SheetFooter>
                <SheetClose as-child>
                    <Button type="submit">
                        关闭
                    </Button>
                </SheetClose>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>
<script setup lang="ts">
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/shadcn/ui/sheet'
import { Button } from '@/components/shadcn/ui/button';
import { useCollectionStore } from '@/store/collections';
import { useDataStore } from '@/store/datasource';
import { toast } from 'vue-sonner';
const showOpen = defineModel<boolean>('open')
//advance feature

//auto import
const { getSongDataList } = useDataStore()
const { UserCollectionList, CurrentCollectionLabel } = useCollectionStore();
const lazy_master_13 = () => {
    const song_list = getSongDataList.list;
    const result_score = new Set<string>([])
    const coll_index = UserCollectionList.findIndex(c => c.label == CurrentCollectionLabel);
    for (const song of song_list) {
        const difficulties = [...song.difficulties.standard, ...song.difficulties.dx];
        for (const diff of difficulties) {
            if (diff.level === "13") {
                result_score.add(`${song.id}_${diff.type}_${diff.level_index}`)
            }
        }
    }
    if (UserCollectionList[coll_index]) {
        UserCollectionList[coll_index].list = result_score;
        toast.success("导入成功，请重新刷新页面")
    }
}
</script>