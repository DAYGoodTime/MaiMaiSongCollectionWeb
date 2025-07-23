import type { Score } from "@/types/datasource";
import type { MaiMaiSong, SongDifficulty } from "@/types/songs";

export const LEVEL_MATCH_PATTEN =
  /^[绿黄红紫白](?:(?:1[0-5]|[1-9])\+|(?:1[0-5]|[1-9])(?:\.\d)?)$/;
export const RANKING_MATCH_PATTEN =
  /^[绿黄红紫白]_/;
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
export const getSongDiff = (song: MaiMaiSong, score: Score) => {
  if (song.difficulties) {
    return song.difficulties[score.type as keyof {
      standard: SongDifficulty[];
      dx: SongDifficulty[];
      utage: SongDifficulty[];
    }].find(level => level.level_index === score.level_index)
  }
  return null;
}
export function getNoteDesigners(song: MaiMaiSong) {
  const diffs = [...song.difficulties.dx, ...song.difficulties.standard]
  return diffs.map(d => {
    if (d.note_designer && d.note_designer !== '-') {
      return d.note_designer.toLowerCase();
    } else return ""
  }).join(" ")
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