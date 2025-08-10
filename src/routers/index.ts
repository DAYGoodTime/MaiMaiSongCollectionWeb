import { createWebHistory, createRouter } from "vue-router";

const routes = [
  { path: "/", name: "Home", component: () => import("@/views/Home.vue") },
  { path: "/test", name: "Test", component: () => import("@/views/Test.vue") },
  { path: "/settings", name: "Settings", component: () => import("@/views/setting/Settings.vue") },
  { path: "/collection", name: "Collection", component: () => import("@/views/collection/Collection.vue") },
  { path: "/:pathMatch(.*)", component: () => import("@/views/NotFound.vue") },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
