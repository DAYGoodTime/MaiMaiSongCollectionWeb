import type { AnyScore, Score } from "@/types/datasource";
import { Clipboard } from "@capacitor/clipboard"
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router";
import { toast } from "vue-sonner";
import versionList from '@/assets/data/versions.json' with { type: 'json' };
import { BASE_NUMBER_RANGE_PATTEN, conventLevelPrefix, conventLevelTag, conventVersionByInt, getSongDiffUniId, isAllFinal, isValidAchievementRange, LEVEL_MATCH_PATTEN, LEVEL_RANGE_MATCH_PATTEN, RANKING_MATCH_PATTEN } from "./StrUtil";
import type { LevelFields, MaiMaiSong, ScoreExtend, SongDifficultyAny, SongType, SongUniId } from "@/types/songs";
import { fcMapping, fsMapping, rateMapping } from "@/api/usagi";
import { ref } from "vue";
import type { LXNSScore } from "@/types/lxns";
import type { UsagiScore } from "@/types/usagi";
import { useScores } from "@/store/datasources/scores";
import type { TagOption } from "@/components/TagInputCombobox.vue";
import { rankingList } from "./urlUtils";
import { isWebEnv } from "@/api/base";
import { Capacitor } from "@capacitor/core";

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
export async function exportFile(content: any, fileName: string, type: string = "application/json") {
  if (isWebEnv()) {
    const blob = new Blob([content], { type: type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return;
  } else if (Capacitor.getPlatform() === "android") {
    let currentStatus = (await Filesystem.checkPermissions()).publicStorage
    if (currentStatus !== 'granted') {
      //尝试请求
      console.log("permissions:", currentStatus);
      console.log("request result", (await Filesystem.requestPermissions()).publicStorage);
      return
    }
    //写入文件
    console.log("writefile", fileName);

    let result = await Filesystem.writeFile({
      path: fileName,
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true
    });
    toast.success(`导出成功，已存入到 ${result.uri}`)
    return;
  }
  toast.error("暂不支持导出")
  // for iso...
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

function getRateType(score: AnyScore): string {
  if ("rate" in score && Number.isInteger(score.rate)) return rateMapping[score.rate as number] //usagi style
  if ("rate" in score && typeof score.rate === "string") return score.rate //fish style
  return (score as LXNSScore).rate_type ?? "d" // lxns style
}

function getFcFsType(fcfs: string | number | null, type: "fc" | "fs"): string | null {
  if (fcfs === null || fcfs === undefined) return null;
  if (typeof fcfs === 'number' && Number.isInteger(fcfs)) {
    switch (type) {
      case "fc":
        return fcMapping[fcfs] ?? null;
      case "fs":
        return fsMapping[fcfs] ?? null;
      default:
        return null;
    }
  }
  return typeof fcfs === 'string' ? fcfs : null;
}
export function conventToScore(score: AnyScore, song: MaiMaiSong): Score {
  const song_id = ("song_id" in score)
    ? toLXNSStyleId(score.song_id)
    : toLXNSStyleId(score.id)
  const raw_id = ("song_id" in score) ? score.song_id : score.id
  const type = toLXNSType(score)
  const diff = song[`${raw_id}_${type}_${score.level_index}`]
  return {
    id: song_id,
    song_name: ("title" in score) ? score.title : score.song_name ?? "Unknown",
    achievements: score.achievements,
    fc: getFcFsType(score.fc, "fc"),
    fs: getFcFsType(score.fs, "fs"),
    level: score.level ?? "0?",
    level_index: score.level_index,
    level_value: ("ds" in score)
      ? score.ds
      : diff?.level_value ?? 0,
    rate_type: getRateType(score),
    dx_score: ("dxScore" in score)
      ? score.dxScore
      : score.dx_score
      ?? 0,
    dx_rating: ("ra" in score)
      ? score.ra
      : score.dx_rating
      ?? 0,
    type,
    play_count: (score as UsagiScore).play_count,
    diff_id: raw_id
  }
}
export function toFishStyleId(id: number, type: SongType) {
  if (type === "dx") {
    return id + 10000
  } else return id;//其它类型id一致
}
export function toLXNSStyleId(id: number) {
  if (id > 10000) {
    //dx与宴谱取后四位
    return id % 10000
  }
  //标谱id一致
  return id;
}
export function toLXNSType(score: AnyScore): SongType {
  let type = score.type;
  //in divingfish utage score's type is "DX" not "utage",only label show it "Utage" lol
  if (("level_label" in score) && score.level_label === "Utage") {
    type = "UTAGE"
  }
  switch (type) {
    case "DX": return "dx";
    case "SD": return "standard";
    case "UTAGE": return "utage";
    default: return type as SongType;
  }
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
  const diff_id = (score.score.type === "utage" && ("diff_id" in score.score)) ? `${score.score.diff_id}_${score.score.type}_${score.score.level_index}` : score.score_id
  return score.song[diff_id as SongUniId]
}
export const getSongDiffByScore = (song: MaiMaiSong, score: Score): SongDifficultyAny | undefined => {
  const uni_id = getSongDiffUniId(song, score)
  return song[uni_id]
}
export const getSongDiffValueIndex = (song: MaiMaiSong) => {
  let list: number[] = []
  for (let i = 0; i <= 4; i++) {
    const arr = song[`level_${i}` as LevelFields]
    Array.prototype.push.apply(list, arr.filter(v => typeof v !== 'string'))
  }
  return list;
}
function _filterDiffByTag(tag: string, diff: SongDifficultyAny, score: Score): boolean {
  // 定数tag过滤
  if (LEVEL_MATCH_PATTEN.test(tag)) {
    const level_filter = conventLevelTag(tag);
    if (level_filter) {
      return diff.level_value === level_filter.level_value
    }
    return false;
  }
  //范围定数过滤
  if (LEVEL_RANGE_MATCH_PATTEN.test(tag)) {
    const [start, end] = tag.split("-");
    const levelStart = Number(start);
    const levelEnd = Number(end)
    return diff.level_value >= levelStart && diff.level_value <= levelEnd
  }
  // 成绩标签过滤 (example:紫鸟加)
  if (RANKING_MATCH_PATTEN.test(tag)) {
    const splits = tag.split("_");
    if (splits.length === 2) {
      const level_index_tag = conventLevelPrefix(splits[0]);
      const ranking_target = rankingList.find(r => r.id === splits[1]);
      if (ranking_target && diff.level_index === level_index_tag && score) {
        return score.achievements >= ranking_target.min && score.achievements <= ranking_target.max
      }
      return false;
    }
  }
  // 成绩范围标签过滤 (example:12.0-13.5)
  if (isValidAchievementRange(tag)) {
    const matched = tag.match(BASE_NUMBER_RANGE_PATTEN);
    if (!matched || matched.length !== 3) return false;
    const start = parseFloat(matched[1]);
    const end = parseFloat(matched[2]);
    return diff.level_value >= start && diff.level_value <= end;
  }
  // 旧框版本特判
  if (tag === "ALL FiNALE") {
    return isAllFinal(conventVersionByInt(diff.version) ?? "");
  }
  // 版本标签过滤
  const versionMatch = versionList.find(v => v.id === tag);
  if (versionMatch) {
    return (conventVersionByInt(diff.version) ?? "") === tag;
  }
  return false;
}
export function filterDiffByTag(tagOption: TagOption, diff: SongDifficultyAny, score: Score): boolean {
  if (tagOption.tags.length === 0) return true;
  const tagFilters = tagOption.tags.map(t => t.value)
  const matchesTags = tagOption.matchEvery ?
    tagFilters.every(tag => _filterDiffByTag(tag, diff, score))
    : tagFilters.some(tag => _filterDiffByTag(tag, diff, score))
  return matchesTags
}