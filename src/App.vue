<script setup lang="ts">
import { SidebarProvider, SidebarTrigger } from '@/components/shadcn/ui/sidebar'
import AppSidebar from './components/AppSidebar.vue';
import { Toaster } from '@/components/shadcn/ui/sonner'
import 'vue-sonner/style.css'
import { onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { NFC } from '@day_time/capacitor-nfc-day';
import { useAppStore } from './store/appStore';
import { useScores } from './store/datasources/scores';
import { useSongStore } from './store/datasources/song';
onMounted(async () => {
  checkUpdate();
  const userAgent = navigator.userAgent;
  console.log("User Agent:", userAgent);
})
const ScoreStore = useScores()
const SongStore = useSongStore()
const checkUpdate = async () => {
  if (SongStore.checkSongUpdate()) {
    await SongStore.updateSongFromAPI()
  }
  let needReSync = ScoreStore.checkScoreVersion()
  if (needReSync) {
    toast.warning("本地数据源结构与当前版本不一致,为了避免错误，我们对本地的数据源进行了重置，请根据需要重新进行获取。")
  }
}
const appStore = useAppStore()
NFC.onRead((data) => {
  console.log("NFC Data", data.string());
  toast.success("正在读取NFC数据", { position: "top-center" })
  const result = data.string();
  appStore.NFCData = result.messages[0].records[0].payload
})
</script>

<template>
  <Toaster />
  <nav>
    <SidebarProvider>
      <AppSidebar />
      <main class="w-full" style="padding-top: env(safe-area-inset-top);">
        <SidebarTrigger class="m-2" />
        <RouterView />
      </main>
    </SidebarProvider>
  </nav>
</template>

<style scoped></style>
