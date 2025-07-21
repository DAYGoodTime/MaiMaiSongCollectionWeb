import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed } from "vue";
export const useAppStore = defineStore("app", () => {
  const UserName = useLocalStorage("user_name", "")
  const hasUserName = computed(() => {
    return UserName.value.length > 0
  })
  return { UserName, hasUserName }
});
