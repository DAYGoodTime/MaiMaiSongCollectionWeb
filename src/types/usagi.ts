export interface UsagiScore {
    /** 曲目 ID LXNS格式*/
    id: number,
    /** 难度标级 */
    level: string,
    /** 难度索引 */
    level_index: number,
    /** 达成率 */
    achievements: number,
    /** FULL COMBO 类型 (可空) */
    fc: number | null,
    /** 难度标级 */
    fs: number | null,
    /** dx分 */
    dx_score: number,
    /** dxRating分 */
    dx_rating: number,
    /** 游玩次数 */
    play_count: number,
    /** 难度标级 0为SSS+ */
    rate: number,
    /** 铺面类型 */
    type: "standard" | "dx" | "utage",
    /** 曲名 */
    title: string,
    /** 谱面定数 */
    level_value: number,
    /** dx分（理论） */
    level_dx_score: number
}