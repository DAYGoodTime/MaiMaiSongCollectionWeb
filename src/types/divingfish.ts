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
export interface FishChartStatsResponse {
    //每个歌曲的 key是song id
    charts: Record<string, Array<FishChartStat>>
    diff_data: Record<string, FishDiffData>
}
export interface FishChartStat {
    //样板数量
    cnt: number,
    //显示等级
    diff: string,
    //拟合难度
    fit_diff: number,
    //平均达成率
    avg: number,
    //平均dx scores
    avg_dx: number,
    //达成率标准差
    std_dev: number,
    //评级分布（依次对应 d, c, b, bb, bbb, a, aa, aaa, s, sp, ss, ssp, sss, sssp）
    dist: Array<number>,
    //Full Combo 分布（依次对应 非、fc、fcp、ap、app）
    fc_dist: Array<number>
}
export interface FishDiffData {
    //平均达成率
    achievements: number,
    //评级分布（依次对应 d, c, b, bb, bbb, a, aa, aaa, s, sp, ss, ssp, sss, sssp）
    dist: Array<number>,
    //Full Combo 分布（依次对应 非、fc、fcp、ap、app）
    fc_dist: Array<number>
}
