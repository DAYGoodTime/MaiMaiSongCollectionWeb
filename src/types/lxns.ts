import type { BasicScore } from "./datasource";

export interface LXNSScore extends BasicScore {
  /** 曲目 ID */
  id: number;
  /** 曲名  */
  song_name: string;
  /** 难度标级  */
  level: string;
  /** 难度索引  */
  level_index: number;
  /** 达成率 (如 97.5 表示 97.50%) */
  achievements: number;
  /** FULL COMBO 类型 (可空) */
  fc?: string | null;
  /** FULL SYNC 类型 (可空) */
  fs?: string | null;
  /** DX 分数 */
  dx_score: number;
  /** DX rating */
  dx_rating: number;
  /** 评级类型 */
  rate_type: string;
  /** 谱面类型 */
  type: string;
  /** 游玩的 UTC 时间 (YYYY-MM-DD HH:mm 格式) */
  play_time: string | null;
  /** 谱面最后游玩的 UTC 时间 */
  last_played_time: string | null;
  /** 是否有拥有成绩（用于构建未游玩难度） */
  is_played?: boolean
}