<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Search,
  Folder,
  Settings,
  ArrowLeft,
  Music
} from '@lucide/vue'
import DesktopAppShell from '@/desktop/components/DesktopAppShell.vue'

const router = useRouter()
const route = useRoute()

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

const onResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

const searchRoute = '/'
const collectionRoute = '/collection'
const settingsRoute = '/settings'

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({
      name: "SongSearch"
    })
  }
}
</script>

<template>
  <!-- 桌面端布局：集成通用 DesktopAppShell -->
  <DesktopAppShell>
    <main class="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8FAFC] dark:bg-[#0B0F19] p-4 lg:p-6 select-none">
      <!-- 顶部操作栏 / 面包屑 -->
      <div class="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-[#1E293B] shrink-0">
        <div class="flex flex-col gap-0.5">
          <span class="text-xs text-[#64748B] dark:text-[#94A3B8]">SongCollections / 404 未找到</span>
          <h1 class="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">页面未找到 · 404 Not Found</h1>
        </div>
        <div class="flex items-center gap-2">
          <button @click="goBack"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#334155] dark:text-[#E2E8F0] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowLeft class="w-3.5 h-3.5" />
            返回上一页
          </button>
          <router-link :to="searchRoute"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 transition-colors shadow-sm">
            <Search class="w-3.5 h-3.5" />
            曲库检索
          </router-link>
        </div>
      </div>

      <!-- 中间 404 核心内容卡片 -->
      <div class="flex-1 flex items-center justify-center py-6">
        <div
          class="w-full max-w-2xl bg-white dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl shadow-sm p-8 sm:p-10 flex flex-col items-center gap-6">
          <!-- 黑胶唱盘 / 404 视觉呈现 -->
          <div class="flex flex-col items-center gap-3">
            <div
              class="relative w-28 h-28 rounded-full bg-[#0F172A] dark:bg-[#030712] border-4 border-blue-500 flex items-center justify-center shadow-lg group hover:rotate-45 transition-transform duration-700 ease-out">
              <div
                class="w-20 h-20 rounded-full bg-[#1E293B] dark:bg-[#0F172A] border-2 border-slate-700 flex items-center justify-center">
                <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <Music class="w-5 h-5 animate-pulse" />
                </div>
              </div>
            </div>
            <div class="text-5xl font-black tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
              4 0 4
            </div>
          </div>

          <!-- 提示文案 -->
          <div class="text-center max-w-lg space-y-2">
            <h2 class="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              哎呀，这首曲子好像迷路了～
            </h2>
            <p class="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              可能是哪个调皮的谱师把音符藏起来了，或者链接输错了小字母。别慌，先回主舞台继续推分吧！
            </p>
          </div>

          <!-- 核心导航按钮组 -->
          <div class="flex flex-wrap items-center justify-center gap-3 w-full">
            <router-link :to="searchRoute"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm">
              <Search class="w-4 h-4" />
              返回曲目检索与分析
            </router-link>
            <router-link :to="collectionRoute"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold text-sm transition-colors">
              <Folder class="w-4 h-4" />
              前往个人合集管理
            </router-link>
            <router-link :to="settingsRoute"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-[#E2E8F0] dark:border-[#1E293B] text-[#475569] dark:text-[#94A3B8] font-medium text-sm transition-colors">
              <Settings class="w-4 h-4" />
              数据源同步设置
            </router-link>
          </div>

          <!-- 底部诊断标识 -->
          <div
            class="flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#94A3B8] dark:text-[#64748B] pt-2 border-t border-[#F1F5F9] dark:border-[#1E293B] w-full">
            <span>REQUEST: {{ route.fullPath }}</span>
            <span>•</span>
            <span>STATUS: 404 NOT FOUND</span>
            <span>•</span>
            <span>BUILD: SongCollections v2.4.0</span>
          </div>
        </div>
      </div>
    </main>
  </DesktopAppShell>
</template>
