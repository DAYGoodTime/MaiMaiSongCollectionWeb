import type { FishScore } from "./divingfish";
import type { LXNSScore } from "./lxns";
import type { UsagiScore } from "./usagi";

export interface DataSource<T> {
    list: T,
    update_time: Date | string,
    version: number
}
export type SongType = "standard" | "dx" | "utage"
export type AnyScore = LXNSScore | FishScore | UsagiScore
export type DataSourceType = AvailableDataSourceType | "empty";
export type AvailableDataSourceType = "divingfish" | "lxns" | "usagi"
export interface Score {
    /** 曲目 ID */
    id: number;
    /** 曲目 ID 水鱼版本（仅供显示) */
    fish_id: number;
    /** 曲名  */
    song_name: string;
    /** 达成率 (如 97.5 表示 97.50%) */
    achievements: number;
    /**FC状态（fc、fcp、ap、app）可空 为 null 或者空字符串 */
    fc: string | null;
    /**FS状态（sync、fs、fsp、fsd、fsdp）可空 为 null 或者空字符串 */
    fs: string | null;
    /** 难度标级 仅精确到整数或 "+" 等级 */
    level: string;
    /** 难度索引 由0到4对应 Basic 到 Re: Master  */
    level_index: number;
    /** 铺面定数 (占位符) */
    level_value?: number;
    /** 评级类型 如 aa、sssp） */
    rate_type: string;
    /** DX 分数 */
    dx_score: number;
    /** DX rating */
    dx_rating: number;
    /** 谱面类型 例如 dx standard utage */
    type: SongType;
    /** 是否有拥有成绩（用于构建未游玩难度） */
    is_played?: boolean;
    /** 游玩次数 (部分数据源支持) */
    play_count?: number;
}
export type CredentialsStorage = Record<AvailableDataSourceType, string>