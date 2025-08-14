export function getImageCoverUrl(id: number) {
  if (id > 1000) {
    id = 10000 + id;
  }
  if (id > 100000) {
    id -= 110000
  }
  return `/cover/${id ?? "0"}.webp`;
}

export function getImageAssertUrl(name: string) {
  return `/resource/${name ?? "FALLBACK"}.png`;
}
export const rankingList = [
  { id: 'SSSp', min: 100.5, max: Infinity },
  { id: 'SSS', min: 100, max: 100.5 },
  { id: 'SSp', min: 99.5, max: 100 },
  { id: 'SS', min: 99, max: 99.5 },
  { id: 'Sp', min: 98, max: 99 },
  { id: 'S', min: 97, max: 98 },
  { id: 'AAA', min: 94, max: 97 },
  { id: 'AA', min: 90, max: 94 },
  { id: 'A', min: 80, max: 90 },
  { id: 'BBB', min: 75, max: 80 },
  { id: 'BB', min: 70, max: 75 },
  { id: 'B', min: 60, max: 70 },
  { id: 'C', min: 40, max: 60 },
  { id: 'D', min: 0, max: 40 },
  { id: 'clean', min: 80, max: Infinity }
];
export const ACHIEVEMENT = {
  SSSP: 100.5,
  SSS: 100,
  SSP: 99.5,
  SS: 99,
  SP: 98,
  S: 97,
  AAA: 94,
  AA: 90,
  A: 80,
  BBB: 75,
  BB: 70,
  B: 60,
  C: 40,
  D: 0,
} as const;
export const ACHIEVEMENT_ICON = {
  SSSP: getAchievementIcon("SSSP"),
  SSS: getAchievementIcon("SSS"),
  SSP: getAchievementIcon("SSP"),
  SS: getAchievementIcon("SS"),
  SP: getAchievementIcon("Sp"),
  S: getAchievementIcon("S"),
  AAA: getAchievementIcon("AAA"),
  AA: getAchievementIcon("AA"),
  A: getAchievementIcon("A"),
  BBB: getAchievementIcon("BBB"),
  BB: getAchievementIcon("BB"),
  B: getAchievementIcon("B"),
  C: getAchievementIcon("C"),
  D: getAchievementIcon("D"),
} as const;
export function getAchievementIcon(rate_type: string) {
  let rate = "FALLBACK";
  if (rate_type && typeof rate_type === "string") {
    rate = rate_type.toUpperCase();
  }
  return getImageAssertUrl(`UI_TTR_Rank_${rate.replace("P", "p")}`)
}
export const PLAY_BONUS = {
  APP: "APp",
  AP: "AP",
  FCP: "FCp",
  FC: "FC",
  FDXP: "FSDp",
  FDX: "FSD",
  FSP: "FSp",
  FS: "FS",
  SYNC: "Sync",
} as const
export const PLAY_BONUS_ICON = {
  APP: getFCFSIcon("APp"),
  AP: getFCFSIcon("AP"),
  FCP: getFCFSIcon("FCp"),
  FC: getFCFSIcon("FC"),
  FDXP: getFCFSIcon("FSDp"),
  FDX: getFCFSIcon("FSD"),
  FSP: getFCFSIcon("FSp"),
  FS: getFCFSIcon("FS"),
  SYNC: getFCFSIcon("Sync"),
} as const
export function getFCFSIcon(fcfs_name: string) {
  let name = fcfs_name;
  if (!name || name.length === 0) name = "Empty"
  return getImageAssertUrl(`UI_CHR_PlayBonus_${name}`)
}
