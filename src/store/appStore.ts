import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
export const useAppStore = defineStore("app", () => {
  const UserName = useLocalStorage("user_name", "");
  const hasUserName = computed(() => UserName.value.length > 0);
  const ComboboxOpen = ref(false);
  const TagComboboxOpen = ref(false);
  const showGlobalSideBarTrigger = ref(true)
  const showCustomSideBarTrigger = ref(true)
  const NFCData = ref("")
  return {
    UserName,
    hasUserName,
    ComboboxOpen,
    TagComboboxOpen,
    showGlobalSideBarTrigger,
    showCustomSideBarTrigger,
    NFCData
  };
});
