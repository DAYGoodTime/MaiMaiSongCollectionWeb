export interface FishScore {
    /**成绩百分比 */
    achievements: number
    /**谱面定数 */
    ds: number
    /**DX 分数 */
    dxScore: number
    /**FC状态（fc、fcp、ap、app） */
    fc: string
    /**FS状态（sync、fs、fsp、fsd、fsdp） */
    fs: string
    /**谱面等级，与 ds 的区别在于仅精确到整数或 "+" 等级 */
    level: string
    /**谱面难度在歌曲里的索引，由0到4对应 Basic 到 Re: Master */
    level_index: number
    /**等级标签（如 Master） */
    level_label: string
    /**单曲rating */
    ra: number
    /**评级（如 aa、sssp） */
    rate: string
    /**歌曲的唯一标识符 */
    song_id: number
    /**歌曲标题 */
    title: string
    /**歌曲类型（ DX 或 SD） */
    type: string
}
export interface FishRecordResponse {
    /**用户的段位信息（可参考此部分） */
    additional_rating: number;
    /**用户的昵称 */
    nickname: string;
    /**用户的牌子信息 */
    plate: string;
    /**用户rating */
    rating: number
    /**用户的成绩记录列表，以具体难度谱面为单位 */
    records: FishScore[]
}
