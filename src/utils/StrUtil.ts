import type { AnyScore, Score } from "@/types/datasource";
import type { MaiMaiSong, ScoreExtend, SongDifficulty } from "@/types/songs";
import { pinyin } from "pinyin-pro";
import { getSongDiffByScoreEx } from "./functionUtil";
import versionList from '@/assets/data/versions.json' with { type: 'json' };

export const LEVEL_MATCH_PATTEN =
  /^[绿黄红紫白](?:(?:1[0-5]|[1-9])\+|(?:1[0-5]|[1-9])(?:\.\d)?)$/;
export const LEVEL_RANGE_MATCH_PATTEN = /^(?:15(?:\.0)?|1[0-4](?:\.\d)?|[1-9](?:\.\d)?)-(?:15(?:\.0)?|1[0-4](?:\.\d)?|[1-9](?:\.\d)?)$/;
export const RANKING_MATCH_PATTEN =
  /^[绿黄红紫白]_/;
export const BASE_NUMBER_RANGE_PATTEN = /^(\d+(?:\.\d{1,4})?)-(\d+(?:\.\d{1,4})?)$/
export function conventLevelPrefix(prefix: string): number | null {
  switch (prefix) {
    case "绿":
      return 0;
    case "黄":
      return 1;
    case "红":
      return 2;
    case "紫":
      return 3;
    case "白":
      return 4;
    default:
      return null;
  }
}
export function conventLevelTag(
  tag: string
): { level_index: number; level_value: number | string } | null {
  if (!LEVEL_MATCH_PATTEN.test(tag)) return null;
  let level_index: number | null = conventLevelPrefix(tag.substring(0, 1));
  if (!level_index) return null;
  const level = tag.substring(1, tag.length);
  let level_value = isNaN(Number(level)) ? String(level) : Number(level);
  if (!level.includes(".") && !level.includes("+"))
    level_value = String(Number(level));
  return {
    level_index,
    level_value,
  };
}

export function LevelIndexToLabel(index: number) {
  if (index < 0 || index > 5)
    throw new Error("level index out of range")
  switch (index) {
    case 0: return "BASIC";
    case 1: return "ADVANCED";
    case 2: return "EXPERT";
    case 3: return "MASTER";
    case 4: return "Re:MASTER";
  }
}

// 格式化日期
export function formatDate(date: Date | string): string {
  let _date = new Date(date)
  if (isNaN(_date.getTime())) return date as string;
  return _date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
export function formatDxRating(dx_rating: number | undefined) {
  if (dx_rating) {
    return dx_rating.toFixed(0)
  } else return 0;
}
export function formatAchievement(achievement: number | undefined) {
  if (achievement) {
    return achievement.toFixed(4)
  } else {
    return "0.0000"
  }
}
export function formatLevelValue(level_value: number | undefined) {
  if (level_value) {
    return level_value.toFixed(1)
  }
  return "NAN"
}
export const getSongDiffUniId = (song: MaiMaiSong, score: Score | AnyScore) => {
  if (song.difficulties) {
    return `${song.id}_${score.type}_${score.level_index}`
  }
  return "0_dx_-1";
}
export const toPy = (str: string) => pinyin(str, { toneType: 'none', separator: '', v: true })
const commonNoteDesignerAliasMapping = new Map([
  ["サファ太", ["沙发太", toPy("沙发太")]],
  ["ロシェ@ペンギン", ["企鹅", toPy("企鹅")]],
  ["はっぴー", ["哈皮", toPy("哈皮"), "狗", toPy("狗")]],
  ["翠楼屋", ["脆脆薯条", toPy("脆脆薯条"), toPy("翠楼屋")]],
  ["小鳥遊さん", ["小鸟游", toPy("小鸟游")]],
  ["mai-Star", ["maistar", toPy("麦思达"), "麦思达"]],
  ["ニャイン", ["二大爷", toPy("二大爷")]],
  ["玉子豆腐", [toPy("玉子豆腐")]],
  ["鳩ホルダー", ["九鸟", toPy("九鸟")]],
  ["Luxizhel", ["泸溪河", toPy("泸溪河")]],
  ["玉子豆腐", [toPy("玉子豆腐")]],
  ["華火職人", ["华火职人", toPy("华火职人")]],
  ["チャン@DP皆伝", ["DP", "DP" + toPy("皆传")]],
  ["ぴちネコ", ["桃子猫", toPy("桃子猫")]],
  ["隅田川星人", [toPy("隅田川星人")]],
])

export function getNoteDesigners(song: MaiMaiSong) {
  const diffs = [...song.difficulties.dx, ...song.difficulties.standard]
  const list = new Set<string>();
  diffs.forEach(d => {
    if (d.note_designer && d.note_designer !== '-') {
      list.add(d.note_designer.toLocaleLowerCase());
      if (commonNoteDesignerAliasMapping.has(d.note_designer)) {
        const alias = commonNoteDesignerAliasMapping.get(d.note_designer) as string[]
        alias.forEach(a => list.add(a))
      }
    }
  })
  return [...list].reverse();
}
export function getNoteDesigner(diff?: SongDifficulty) {
  if (!diff) return ""
  if (diff.note_designer && diff.note_designer !== '-') {
    return diff.note_designer
  } else return ""
}
export const getLevelValue = (sc: ScoreExtend) => {
  const diff = getSongDiffByScoreEx(sc);
  if (diff) return diff.level_value;
  return 0
}
export function conventFcFsStr(fcfs: string | null | undefined) {
  switch (fcfs) {
    case "fc": return "FC"
    case "fcp": return "FCp"
    case "ap": return "AP"
    case "app": return "APp"
    case "sync": return "Sync"
    case "fs": return "FS"
    case "fsp": return "FSp"
    case "fsd": return "FSD"
    case "fsdp": return "FSDp"
    default: "Empty"
  }
  return "Empty"
}
export function getProjectVersion() {
  return import.meta.env.VITE_PROJECT_VERSION;
}
export function getTotalDxScore(diff?: SongDifficulty | null): number {
  if (diff) {
    return (diff.tap_num + diff.hold_num + diff.slide_num + diff.touch_num + diff.break_num) * 3
  } else return 1;
}
export function getDxScoreRadio(ex: ScoreExtend) {
  const totalDxScore = getTotalDxScore(getSongDiffByScoreEx(ex));
  const radio = ex.score.dx_score / totalDxScore
  if (radio > 1) return 0;
  return radio;
}
export function isValidAchievementRange(tag: string): boolean {
  if (!tag || typeof tag !== 'string' || tag.length === 0) return false;
  const matched = tag.match(BASE_NUMBER_RANGE_PATTEN);
  if (!matched || matched.length !== 3) return false;
  const start = parseFloat(matched[1]);
  const end = parseFloat(matched[2]);
  return (start >= 80 && end >= 80) && (start < end);
}
// Version Conversion
const versionMap = new Map<number, string>(versionList.map((o) => [o.version_id, o.id]));
// 预排序的键数组（升序）
const sortedKeys = Array.from(versionMap.keys()).sort((a, b) => a - b);
export const conventVersionByInt = (version: number) => {
  if (versionMap.has(version)) {
    return versionMap.get(version);
  } else {
    // 边界处理：当数值小于最小版本时
    if (version < sortedKeys[0]) return undefined;
    // 二分查找实现
    let left = 0;
    let right = sortedKeys.length - 1;
    let resultKey = sortedKeys[0]; // 默认取最小值
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const currentKey = sortedKeys[mid];
      if (currentKey === version) {
        resultKey = currentKey;
        break;
      } else if (currentKey < version) {
        resultKey = currentKey;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return versionMap.get(resultKey);
  }
};
export function isAllFinal(version: string) {
  return !version.includes("DX");
}