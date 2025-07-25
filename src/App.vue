<script setup lang="ts">
import { SidebarProvider, SidebarTrigger } from '@/components/shadcn/ui/sidebar'
import AppSidebar from './components/AppSidebar.vue';
import { Toaster } from '@/components/shadcn/ui/sonner'
import 'vue-sonner/style.css'
import { onMounted } from 'vue';
import { flatMapById, useDataStore } from './store/datasource';
import type { DataSource, Score } from './types/datasource';
import { toast } from 'vue-sonner';
import type { LXNSScore } from './types/lxns';
import type { FishScore } from './types/divingfish';
onMounted(() => {
  const lxn = checkDataSource(DataSourceStore.LXNSSource);
  if (lxn) DataSourceStore.LXNSSource.list = lxn;
  const fish = checkDataSource(DataSourceStore.DivingFishSource);
  if (fish) DataSourceStore.DivingFishSource.list = fish;
})
const DataSourceStore = useDataStore();
const checkDataSource = (source: DataSource<Map<number, Score[]>>) => {
  if (source.list.size > 0) {
    const list = Array.from(DataSourceStore.getLXNSScoreList.value.list.values()).flat();
    //检测是否为旧版本结构
    if (!("fish_id" in list[0])) {
      //进行兼容修复
      toast("发现旧数据，尝试进行升级", { position: "top-center" });
      return flatMapById((list as unknown[]) as FishScore[] | LXNSScore[]);
    }
  }
  return null;
}
</script>

<template>
  <Toaster />
  <nav>
    <SidebarProvider>
      <AppSidebar />
      <main class="w-full">
        <SidebarTrigger />
        <RouterView />
      </main>
    </SidebarProvider>
  </nav>

</template>

<style scoped></style>
