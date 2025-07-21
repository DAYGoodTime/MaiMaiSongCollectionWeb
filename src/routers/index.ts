import NotFound from "@/views/NotFound.vue";
import { createWebHistory, createRouter } from "vue-router";

const routes = [
  { path: "/", name: "Home", component: () => import("@/views/Home.vue") },
  { path: "/test", name: "Test", component: () => import("@/views/Test.vue") },
  { path: "/settings", name: "Settings", component: () => import("@/views/Settings.vue") },
  { path: "/collection", name: "Collection", component: () => import("@/views/Collection.vue") },
  { path: "/:pathMatch(.*)", component: NotFound },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
