import type { AnyScore, Score } from "@/types/datasource";
import { Clipboard } from "@capacitor/clipboard"
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import { toast } from "vue-sonner";
import { getSongDiffUniId } from "./StrUtil";
import type { MaiMaiSong, ScoreExtend, SongDifficultyAny, SongType } from "@/types/songs";
import { fcMapping, fsMapping, rateMapping } from "@/api/usagi";
import { ref } from "vue";
import { useScores } from "@/store/datasources/scores";

type DebouncedFunction<T extends any[]> = (...args: T) => void;

export function debounce<T extends any[]>(
  fn: (...args: T) => void,
  delay: number = 300,
  immediate: boolean = false
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  let isFirstCall = true;

  return (...args: T) => {
    const callNow = immediate && isFirstCall;
    isFirstCall = false;

    clearTimeout(timeoutId);

    if (callNow) {
      fn.apply(null, args);
    } else {
      timeoutId = setTimeout(() => {
        fn.apply(null, args);
        isFirstCall = true;
      }, delay);
    }
  };
}
export function useRouterHelper() {
  const router = useRouter();
  const route = useRoute();
  const JumpTo = (to: RouteLocationRaw) => {
    return router.push(to)
  }
  const JumpToFromEvent = (e: Event, to: RouteLocationRaw) => {
    e.preventDefault();
    return router.push(to)
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
export function useCopyHelper() {
  const handelCopy = (title: string, message: string) => {
    try {
      Clipboard.write({
        string: title
      })
      toast.success(message, { position: "top-center" })
    } catch (error) {
      const message = `无法复制到剪切板中 ${error instanceof Error ? ':' + error.message : ''}`
      toast.error(message, { position: "top-center" })
      console.error(error);
    }
  }
  return { handelCopy }
}
export function conventToScore(score: AnyScore, song: MaiMaiSong): Score {
  let rate_type;
  if ("rate" in score) {
    //usagi or fish
    if (Number.isInteger(score.rate)) {
      //usagi
      rate_type = rateMapping[score.rate as number]
    } else {
      //fish
      rate_type = score.rate as string
    }
  } else {
    //lxns
    rate_type = score.rate_type
  }
  let fc
  if (Number.isInteger(score.fc)) {
    //usagi
    fc = fcMapping[score.fc as number]
  } else {
    fc = score.fc as string | null
  }
  let fs
  if (Number.isInteger(score.fs)) {
    //usagi
    fs = fsMapping[score.fs as number]
  } else {
    fs = score.fs as string | null
  }
  const song_id = ("song_id" in score) ? toLXNSStyleId(score.song_id) : toLXNSStyleId(score.id)
  const raw_id = ("song_id" in score) ? score.song_id : score.id
  let type = toLXNSType(score.type) as SongType
  //why your type is wrong
  if ("level_label" in score && score.level_label === "Utage") type = "utage"
  return {
    id: song_id,
    fish_id: ("song_id" in score) ? score.song_id : toFishStyleId(score.id),
    song_name: ("title" in score) ? score.title : score.song_name,
    achievements: score.achievements,
    fc,
    fs,
    level: score.level,
    level_index: score.level_index,
    level_value: ("ds" in score) ? score.ds : getSongDiffByScore(song, score)?.level_value,
    rate_type,
    dx_score: ("dxScore" in score) ? score.dxScore : score.dx_score,
    dx_rating: ("ra" in score) ? score.ra : score.dx_rating,
    type,
    play_count: ("play_count" in score) ? score.play_count : void 0,
    diff_id: raw_id
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
export function showCurrentStyleId(id: number) {
  if (useScores().selectedSource === 'divingfish') return toFishStyleId(id);
  else return id
}
/**
 * 对数组进行分页处理
 * @param array 需要分页的原始数组
 * @param currentPage 当前页码（从1开始，默认值1）
 * @param itemsPerPage 每页元素数量（默认值10）
 * @returns 当前页对应的数据子集
 */
export function paginateArray<T>(
  array: T[],
  currentPage: number = 1,
  itemsPerPage: number = 10
): T[] {
  // 参数有效性校验
  if (!Number.isInteger(currentPage) || currentPage < 1) {
    throw new Error("currentPage must be a positive integer")
  }

  if (!Number.isInteger(itemsPerPage) || itemsPerPage <= 0) {
    throw new Error("itemsPerPage must be a positive integer")
  }

  // 计算分页边界
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  // 返回分页结果
  return array.slice(startIndex, endIndex)
}
export const useNFC = (callback: (message: string) => void) => {
  const isSupported = 'NDEFReader' in window;
  const isScanning = ref(false)
  const error = ref<Error | null>(null)
  const message = ref<any>(null)
  let reader: any | null = null
  let abortController: AbortController | null = null
  const startScan = async () => {
    if (!isSupported) {
      error.value = new Error("NFC is Not Supported")
      return;
    }
    if (isScanning.value) {
      return
    }
    try {
      reader = new (window as any).NDEFReader();
      abortController = new AbortController()

      await reader.scan({ signal: abortController.signal })

      isScanning.value = true
      error.value = null
      message.value = null
      toast.info("正在扫描NFC", { position: "top-center" })
      reader.addEventListener('reading', (event: any) => {
        console.log('NFC读取:', event);
        message.value = event.message
        //尝试解码数据
        try {
          const Record = event.message.records[0];
          if (Record) {
            const decoder = new TextDecoder()
            const data = decoder.decode(Record.data);
            callback(data)
          } else {
            console.warn("NFC读取为空");
          }
          stopScan();
        } catch (err: any) {
          console.error("NFC解码失败", err);
          error.value = err as Error
        }
      })
      reader.addEventListener('error', (event: any) => {
        console.error('读取失败:', event)
        error.value = new Error('读取失败')
        stopScan()
      })

    } catch (err: any) {
      console.error('NFC读取失败:', err)
      error.value = err
      isScanning.value = false
    }
  }
  const stopScan = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
      isScanning.value = false
      console.log('NFC scan stopped.')
    }
  }
  return {
    isSupported,
    isScanning,
    error,
    message,
    startScan,
    stopScan
  }
}
export const getSongDiffByScoreEx = (score: ScoreExtend): SongDifficultyAny | undefined => {
  const uni_id = getSongDiffUniId(score.song, score.score)
  return score.song[uni_id as keyof MaiMaiSong] as unknown as SongDifficultyAny | undefined;
}
export const getSongDiffByScore = (song: MaiMaiSong, score: Score | AnyScore): SongDifficultyAny | undefined => {
  const uni_id = getSongDiffUniId(song, score)
  return song[uni_id as keyof MaiMaiSong] as unknown as SongDifficultyAny | undefined;
}
