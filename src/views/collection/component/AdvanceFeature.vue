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
                        <Button @click="levelImportDialog = true">定数导入</Button>
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
    <ImportLevel v-model:open="levelImportDialog" />
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
import ImportLevel from './ImportLevel.vue';
import { ref } from 'vue';
const showOpen = defineModel<boolean>('open')
//advance feature
const levelImportDialog = ref(false);
</script>