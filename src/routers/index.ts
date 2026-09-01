import { useAppStore } from "@/store/appStore";
import { storeToRefs } from "pinia";
import { createWebHistory, createRouter } from "vue-router";
declare module 'vue-router' {
  interface RouteMeta {
    // 是否展示全局统一的浮动菜单栏按钮
    globalTrigger: boolean
    // 是否展示组件自义定浮动菜单栏
    customTrigger: boolean
  }
}
const routes = [
  { path: "/", name: "SongSearch", component: () => import("@/desktop/views/SongSearch.vue"), meta: { globalTrigger: true, customTrigger: false } },
  { path: "/collection", name: "DesktopCollection", component: () => import("@/desktop/views/Collection.vue"), meta: { globalTrigger: false, customTrigger: false } },
  { path: "/settings", name: "DesktopSettings", component: () => import("@/desktop/views/Settings.vue"), meta: { globalTrigger: false, customTrigger: false } },
  { path: "/:pathMatch(.*)", component: () => import("@/desktop/NotFound.vue"), meta: { globalTrigger: true, customTrigger: false } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeResolve((to, _from) => {
  const { showCustomSideBarTrigger, showGlobalSideBarTrigger } = storeToRefs(useAppStore())
  showGlobalSideBarTrigger.value = to.meta.globalTrigger
  showCustomSideBarTrigger.value = to.meta.customTrigger
})

export default router