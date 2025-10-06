import { conventLevelPrefix, conventLevelTag, LEVEL_MATCH_PATTEN, RANKING_MATCH_PATTEN, LEVEL_RANGE_MATCH_PATTEN, isValidAchievementRange, BASE_NUMBER_RANGE_PATTEN } from "@/utils/StrUtil";
import { rankingList } from "@/utils/urlUtils";
import type { SongDifficulty, SongDifficultyUtage } from "@/types/songs";
import { useScores } from "@/store/datasources/scores";
export interface OrderBadge {
    label: string,
    value: string,
    status_index: number
}


export const filterDiffByLevelTag = (song_id: number, diffs: SongDifficulty[] | SongDifficultyUtage[], tags: string[]) => {
    const result: string[] = []
    for (const diff of diffs) {
        //宴谱默认拒绝
        if (diff.type === "utage" || ("kanji" in diff)) continue;
        for (const tag of tags) {
            const isLevelPatten = LEVEL_MATCH_PATTEN.test(tag);
            const isLevelRangePatten = LEVEL_RANGE_MATCH_PATTEN.test(tag)
            if (!isLevelPatten && !isLevelRangePatten) continue;
            if (isLevelPatten) {
                const level_filter = conventLevelTag(tag);
                if (level_filter) {
                    if (diff.level_index === level_filter.level_index
                        && diff.level_value === level_filter.level_value
                    ) {
                        result.push(`${song_id}_${diff.type}_${diff.level_index}`)
                    }
                }

            }
            if (isLevelRangePatten) {
                const [start, end] = tag.split("-");
                const levelStart = Number(start);
                const levelEnd = Number(end)
                if (diff.level_value >= levelStart && diff.level_value <= levelEnd) {
                    result.push(`${song_id}_${diff.type}_${diff.level_index}`)
                }
            }
        }
    }
    return result;
}
export const filterDiffByAchievementTag = (song_id: number, diffs: SongDifficulty[] | SongDifficultyUtage[], tags: string[]): string[] => {
    const result: string[] = []
    const ScoreStore = useScores()
    for (const diff of diffs) {
        let score;
        if (diff.type === "utage" && ("kanji" in diff)) {
            //处理宴谱
            score = ScoreStore.getScoreByUni(diff.diff_id, diff.type, diff.level_index)
        } else {
            score = ScoreStore.getScoreByUni(song_id, diff.type, diff.level_index);
        }
        if (!score) continue;
        for (const tag of tags) {
            if (RANKING_MATCH_PATTEN.test(tag)) {
                const splits = tag.split("_");
                if (splits.length < 2) continue;
                const level_index_tag = conventLevelPrefix(splits[0]);
                const ranking_target = rankingList.find(r => r.id === splits[1]);
                if (!ranking_target) continue;
                if (diff.level_index === level_index_tag
                    && (ranking_target.min <= score.achievements && ranking_target.max >= score.achievements)
                ) {
                    result.push(`${score.diff_id}_${diff.type}_${diff.level_index}`)
                }
            }
            if (isValidAchievementRange(tag)) {
                const matched = tag.match(BASE_NUMBER_RANGE_PATTEN);
                if (!matched || matched.length !== 3) continue;
                const start = parseFloat(matched[1]);
                const end = parseFloat(matched[2]);
                if (start <= score.achievements && end >= score.achievements) {
                    result.push(`${score.diff_id}_${diff.type}_${diff.level_index}`)
                }
            }
        }
    }
    return result;
}


