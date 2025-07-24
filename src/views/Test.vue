<template>
    <div>这里只是一个测试界面</div>
    {{ `length:${ScrollList.length}` }}
    <div>
        <Button @click="ScrollList.reverse()">翻转</Button>
    </div>
    <!-- <InfiniteScrollArea :load-data="handelLoadMore" :items="ScrollList">
        <template #default="{ items }">
            <div v-for="i in items" :key="i.value" class="w-72 h-24 border rounded bg-MASTER">
                {{ i.label }}
            </div>
        </template>
</InfiniteScrollArea> -->
</template>
<script setup lang="ts">
import { Button } from '@/components/shadcn/ui/button';
import InfiniteScrollArea from '@/components/InfiniteScrollArea.vue';
import { ref } from 'vue';
interface Test {
    label: string,
    value: number
}
const ScrollList = ref<Test[]>([])
const handelLoadMore = async (page: number, pageSize: number) => {
    console.log("load", page, pageSize);

    let list: Test[] = [];
    for (let i = (page - 1) * pageSize; i <= page * pageSize; i++) {
        list.push({
            label: `label-${i}`,
            value: i
        })
    }
    return list
}
</script>
