import type { Score } from "@/types/datasource";
import type { FishScore } from "@/types/divingfish";
import type { LXNSScore } from "@/types/lxns";
import type { MaiMaiSong, ScoreExtend, SongDifficulty } from "@/types/songs";

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
export const getSongDiff = (song: MaiMaiSong, score: Score | FishScore | LXNSScore) => {
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
  const list = new Set<string>();
  diffs.forEach(d => {
    if (d.note_designer && d.note_designer !== '-') {
      list.add(d.note_designer.toLocaleLowerCase());
    }
  })
  return [...list].reverse();
}
export function getNoteDesigner(diff: SongDifficulty) {
  if (diff.note_designer && diff.note_designer !== '-') {
    return diff.note_designer
  } else return ""
}
export const getLevelValue = (sc: ScoreExtend) => {
  const diff = getSongDiff(sc.song, sc.score);
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
export const SongGenreList =
  [
    { label: "舞萌", value: "maimai" },
    { label: "流行＆动漫", value: "POPSアニメ" },
    { label: "其它游戏", value: "ゲームバラエティ" },
    { label: "niconico＆VOCALOID™", value: "niconicoボーカロイド" },
    { label: "东方Project", value: "東方Project" },
    { label: "音击/中二节奏", value: "オンゲキCHUNITHM" },
    { label: "宴会场", value: "宴会場" },
  ]
export const SongMapList =
  [
    { label: '10周年纪念区域', value: '10周年纪念区域' },
    { label: 'sasakure.UK区域', value: 'sasakure.UK区域' },
    { label: 'DECO*27区域', value: 'DECO*27区域' },
    { label: 'グルーヴコースター区域', value: 'グルーヴコースター区域' },
    { label: 'ピノキオピー区域', value: 'ピノキオピー区域' },
    { label: 'CHUNITHM区域2', value: 'CHUNITHM区域2' },
    { label: 'からめる区域2', value: 'からめる区域2' },
    { label: 'CHUNITHM区域3', value: 'CHUNITHM区域3' },
    { label: 'BLACK ROSE区域', value: 'BLACK ROSE区域' },
    { label: '大都会区域2 イーシュ襲来', value: '大都会区域2 イーシュ襲来' },
    { label: '大都会区域2 黒姫の逆襲', value: '大都会区域2 黒姫の逆襲' },
    { label: '启程区域2', value: '启程区域2' },
    { label: 'みかんヶ岡区域 朝焼け通り', value: 'みかんヶ岡区域 朝焼け通り' },
    { label: 'みかんヶ岡区域 月夜通り', value: 'みかんヶ岡区域 月夜通り' },
    { label: '天界区域2', value: '天界区域2' },
    { label: 'syudou区域', value: 'syudou区域' },
    { label: 'すりぃ区域', value: 'すりぃ区域' },
    { label: '咻哇咻哇区域', value: '咻哇咻哇区域' },
    { label: '大都会区域3', value: '大都会区域3' },
    { label: '天空街区域', value: '天空街区域' },
    { label: '天界区域3', value: '天界区域3' },
    { label: '咻哇咻哇区域2', value: '咻哇咻哇区域2' },
    { label: '天空街区域2', value: '天空街区域2' },
    { label: 'kawaii区域', value: 'kawaii区域' },
    { label: '高天原区域', value: '高天原区域' },
    { label: '宇宙空间站区域', value: '宇宙空间站区域' },
    { label: '天界区域4', value: '天界区域4' },
    { label: '大都会区域4', value: '大都会区域4' },
    { label: '7sRef区域', value: '7sRef区域' },
    { label: '宇宙空间站区域2', value: '宇宙空间站区域2' },
    { label: 'BLACK ROSE区域6', value: 'BLACK ROSE区域6' },
    { label: '大都会区域5', value: '大都会区域5' },
    { label: '天界区域5', value: '天界区域5' },
    { label: '7sRef区域2', value: '7sRef区域2' },
    { label: 'CHUNITHM区域', value: 'CHUNITHM区域' },
    { label: 'オンゲキ区域5', value: 'オンゲキ区域5' },
    { label: 'Diverse System区域', value: 'Diverse System区域' },
    { label: '欢乐节日区域', value: '欢乐节日区域' },
    { label: 'BLACK ROSE区域7', value: 'BLACK ROSE区域7' },
    { label: '大都会区域6', value: '大都会区域6' },
    { label: '天空街区域3', value: '天空街区域3' },
    { label: '天界区域6', value: '天界区域6' },
    { label: '東方Project×オンゲキ区域', value: '東方Project×オンゲキ区域' },
    { label: 'さなちゃんねる区域', value: 'さなちゃんねる区域' },
    { label: '樋口楓区域', value: '樋口楓区域' },
    { label: '電音部区域', value: '電音部区域' },
    { label: 'いよわ区域', value: 'いよわ区域' },
    { label: 'Arcaea区域2', value: 'Arcaea区域2' },
    { label: '欢乐节日区域2', value: '欢乐节日区域2' },
    { label: 'BLACK ROSE区域8', value: 'BLACK ROSE区域8' },
    { label: '7sRef区域3', value: '7sRef区域3' },
    { label: '天空街区域4', value: '天空街区域4' },
    { label: '10周年纪念区域2', value: '10周年纪念区域2' },
    { label: '龙之区域2', value: '龙之区域2' },
    { label: 'オンゲキ区域6', value: 'オンゲキ区域6' },
    { label: 'ヒメヒナ区域', value: 'ヒメヒナ区域' },
    { label: 'WACCA区域', value: 'WACCA区域' },
    { label: 'NEEDY GIRL OVERDOSE区域', value: 'NEEDY GIRL OVERDOSE区域' },
    { label: 'Muse Dash区域', value: 'Muse Dash区域' },
    { label: 'MEGAREX区域', value: 'MEGAREX区域' },
    { label: '音楽的同位体　可不区域', value: '音楽的同位体　可不区域' },
    { label: '東方Project×イロドリミドリ区域', value: '東方Project×イロドリミドリ区域' },
    { label: '派对区域', value: '派对区域' },
    { label: 'BLACK ROSE区域9', value: 'BLACK ROSE区域9' },
    { label: '大都会区域7', value: '大都会区域7' },
    { label: '天空街区域5', value: '天空街区域5' },
    { label: 'ヘブンバーンズレッド区域', value: 'ヘブンバーンズレッド区域' },
    { label: 'TJ.hangneil区域', value: 'TJ.hangneil区域' },
    { label: '月面区域', value: '月面区域' },
    { label: '東北ずん子区域', value: '東北ずん子区域' },
    { label: '裏 月面区域', value: '裏 月面区域' },
    { label: '派对区域2', value: '派对区域2' },
    { label: '大都会区域8', value: '大都会区域8' },
    { label: '花譜区域', value: '花譜区域' },
    { label: 'ゆこぴ区域', value: 'ゆこぴ区域' },
    { label: 'グルーヴコースター区域2', value: 'グルーヴコースター区域2' },
    { label: 'にじさんじのB級バラエティ（仮）区域', value: 'にじさんじのB級バラエティ（仮）区域' },
    { label: '＃コンパス区域2', value: '＃コンパス区域2' }
  ]
export const SongVersionList =
  [
    {
      value: "maimai",
      label: "maimai",
    },
    {
      value: "maimai PLUS",
      label: "maimai PLUS",
    },
    {
      value: "maimai GreeN",
      label: "maimai GreeN",
    },
    {
      value: "maimai GreeN PLUS",
      label: "maimai GreeN PLUS",
    },
    {
      value: "maimai ORANGE",
      label: "maimai ORANGE",
    },
    {
      value: "maimai ORANGE PLUS",
      label: "maimai ORANGE PLUS",
    },
    {
      value: "maimai PiNK",
      label: "maimai PiNK",
    },
    {
      value: "maimai PiNK PLUS",
      label: "maimai PiNK PLUS",
    },
    {
      value: "maimai MURASAKi",
      label: "maimai MURASAKi",
    },
    {
      value: "maimai MURASAKi PLUS",
      label: "maimai MURASAKi PLUS",
    },
    {
      value: "maimai MiLK",
      label: "maimai MiLK",
    },
    {
      value: "maimai MiLK PLUS",
      label: "maimai MiLK PLUS",
    },
    {
      value: "maimai FiNALE",
      label: "maimai FiNALE",
    }, {
      value: "maimai DX",
      label: "舞萌DX2025",
    },
    {
      value: "maimai DX SPLASH",
      label: "舞萌DX2021",
    },
    {
      value: "maimai DX UNIVERSE",
      label: "舞萌DX2022",
    },
    {
      value: "maimai DX FESTIVAL",
      label: "舞萌DX2023",
    },
    {

      value: "maimai DX BUDDIES",
      label: "舞萌DX2024",
    },
    {
      value: "maimai DX PRISM",
      label: "舞萌DX2025",
    }
  ]