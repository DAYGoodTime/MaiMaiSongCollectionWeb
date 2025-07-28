<script setup lang="ts">
import { SidebarProvider, SidebarTrigger } from '@/components/shadcn/ui/sidebar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/ui/dialog'
import { Button } from './components/shadcn/ui/button';
import AppSidebar from './components/AppSidebar.vue';
import { Toaster } from '@/components/shadcn/ui/sonner'
import 'vue-sonner/style.css'
import { onMounted, ref } from 'vue';
import { useDataStore } from './store/datasource';

onMounted(() => {
  checkDataSource();
})
const DataSourceStore = useDataStore();
const showReSyncDialog = ref(false)
const checkDataSource = () => {
  if (DataSourceStore.getSongDataList.version !== DataSourceStore.CURRENT_SONG_VERSION) {
    console.warn("歌曲数据库版本与项目版本不匹配！", `当前版本:${DataSourceStore.getSongDataList.version} 项目版本:${DataSourceStore.CURRENT_SONG_VERSION}`);
  }
  let needReSync = false;
  if (DataSourceStore.DivingFishSource.version !== DataSourceStore.CURRENT_SCORE_VERSION) {
    needReSync = true;
    DataSourceStore.ClearDataSource("divingfish");
  }
  if (DataSourceStore.LXNSSource.version !== DataSourceStore.CURRENT_SCORE_VERSION) {
    needReSync = true;
    DataSourceStore.ClearDataSource("lxns");
  }
  showReSyncDialog.value = needReSync;
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
  <!-- 数据更新提醒 -->
  <Dialog v-model:open="showReSyncDialog">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>数据源需要更新</DialogTitle>
        <DialogDescription>
          为了避免错误，我们对本地的数据源进行了重置，请根据需要重新进行获取。
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="submit" class=" cursor-pointer" @click="showReSyncDialog = false">
          了解
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped></style>
