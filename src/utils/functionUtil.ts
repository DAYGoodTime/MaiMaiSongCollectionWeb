import type { Score } from "@/types/datasource";
import type { FishScore } from "@/types/divingfish";
import type { LXNSScore } from "@/types/lxns";
import { useClipboard, usePermission } from "@vueuse/core";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import { toast } from "vue-sonner";

type DebouncedFunction<T extends any[]> = (...args: T) => void;

export function debounce<T extends any[]>(
  fn: (...args: T) => void,
  delay: number = 300
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(null, args);
    }, delay);
  };
}
export function useRouterHelper() {
  const router = useRouter();
  const route = useRoute();
  const JumpTo = (to: RouteLocationRaw) => {
    router.push(to)
  }
  const JumpToFromEvent = (e: Event, to: RouteLocationRaw) => {
    e.preventDefault();
    router.push(to)
  }
  const backHome = () => {
    router.push({
      name: "Home"
    })
  }
  return { router, route, JumpTo, JumpToFromEvent, backHome }
}
export function exportFile(content: any, fileName: string, type: string = "application/json") {
  const blob = new Blob([content], { type: type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
const copyWireAccess = usePermission('clipboard-write')
export function useCopyHelper() {
  const { copy } = useClipboard({ legacy: true })
  const handelCopy = (title: string, message: string) => {
    console.log("copy", copyWireAccess.value);

    if (copyWireAccess.value === 'granted') {
      copy(title)
        .then(() => {
          toast.success(message, { position: "top-center" })
        })
    } else {
      toast.error("请允许剪切板操作，否则不可复制", { position: "top-center" })
    }
  }
  return { handelCopy }
}
export function conventToScore(score: LXNSScore | FishScore): Score {
  return {
    id: ("song_id" in score) ? toLXNSStyleId(score.song_id) : score.id,
    fish_id: ("song_id" in score) ? score.song_id : toFishStyleId(score.id),
    song_name: ("title" in score) ? score.title : score.song_name,
    achievements: score.achievements,
    fc: score.fc,
    fs: score.fs,
    level: score.level,
    level_index: score.level_index,
    rate_type: ("rate" in score) ? score.rate : score.rate_type,
    dx_score: ("dxScore" in score) ? score.dxScore : score.dx_score,
    dx_rating: ("ra" in score) ? score.ra : score.dx_rating,
    type: toLXNSType(score.type)
  }
}
export function toFishStyleId(id: number) {
  if (id > 100000) {
    //宴谱取后四位
    let sid = id % 10000
    //如果是DX还得转换
    if (sid > 1000) {
      //DX谱为1xxxx
      return sid + 10000
    }
    return sid;
  }
  if (id > 1000) {
    //DX谱为1xxxx
    return id + 10000
  }
  //标谱id一致
  return id;
}
export function toLXNSStyleId(id: number) {
  if (id > 10000) {
    //dx与宴谱取后四位
    return id % 10000
  }
  //标谱id一致
  return id;
}
function toLXNSType(type: string) {
  switch (type) {
    case "DX": return "dx";
    case "SD": return "standard";
    case "UTAGE": return "utage";
    default: return type;
  }
}