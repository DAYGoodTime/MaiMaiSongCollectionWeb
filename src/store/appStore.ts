import type { OrderBadge } from "@/types/component";
import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useChartData } from "./chartStats";
import { useScores } from "./datasources/scores";
export const useAppStore = defineStore("app", () => {
  const UserName = useLocalStorage("user_name", "");
  const CharDataStore = useChartData()
  const DataSourceStore = useScores()
  const hasUserName = computed(() => UserName.value.length > 0);
  const ComboboxOpen = ref(false);
  const TagComboboxOpen = ref(false);
  const showGlobalSideBarTrigger = ref(true)
  const showCustomSideBarTrigger = ref(true)
  const NFCData = ref("")
  const OrderBadges = ref<OrderBadge[]>([
    { label: "达成率", value: "achievement", status_index: 2, isSupport: () => true },
    { label: "Dx Rating", value: "dx_rating", status_index: 0, isSupport: () => true },
    { label: "定数", value: "level", status_index: 0, isSupport: () => true },
    { label: "dx分", value: "dx_score", status_index: 0, isSupport: () => true },
    { label: "游玩次数", value: "play_count", status_index: 0, isSupport: () => DataSourceStore.selectedSource === 'usagi' },
    { label: "拟合定数", value: "chart_level_stat", status_index: 0, isSupport: () => CharDataStore.hasChartData },
    { label: "拟合定数差", value: "chart_level_diff", status_index: 0, isSupport: () => CharDataStore.hasChartData },
  ])
  const SelectedCollOrder = ref<OrderBadge>(OrderBadges.value[0])
  return {
    UserName,
    hasUserName,
    ComboboxOpen,
    TagComboboxOpen,
    showGlobalSideBarTrigger,
    showCustomSideBarTrigger,
    NFCData,
    SelectedCollOrder,
    OrderBadges
  };
});
