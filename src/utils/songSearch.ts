import { conventLevelPrefix, conventLevelTag, LEVEL_MATCH_PATTEN, RANKING_MATCH_PATTEN, LEVEL_RANGE_MATCH_PATTEN, isValidAchievementRange, BASE_NUMBER_RANGE_PATTEN } from "@/utils/StrUtil";
import { isAllFinal, versionList } from "@/utils/version";
import { toLXNSStyleId } from "@/utils/functionUtil";
import { rankingList } from "@/utils/urlUtils";
import type { MaiMaiSong, SongDifficulty, SongDifficultyUtage } from "@/types/songs";
import { useAppStore } from "@/store/appStore";
import { toRaw } from "vue";
import { useSongStore } from "@/store/datasources/song";
import { useScores } from "@/store/datasources/scores";
export interface OrderBadge {
    label: string,
    value: string,
    status_index: number
}

export const MAX_SEARCH_NUMBER = 200;

export const useSongSearch = () => {
    const appStore = useAppStore();
    const SongStore = useSongStore()
    const ScoreStore = useScores()
    const SongIndex = toRaw(appStore.SongIndex)
    const SONG_DATA = SongStore.getSongList()
    const searchSong = (keyword: string) => {
        const searchLower = keyword.toLowerCase().trim();
        const searchNumber = !isNaN(Number(keyword)) ? toLXNSStyleId(Number(keyword)) : null;
        let songsToShow: MaiMaiSong[] = [];
        if (searchNumber !== null) {
            // 如果搜索为id，则直接映射
            const songById = SongStore.SONG_LIST.list[searchNumber]
            // 若存在对应id则直接返回结果
            if (songById) {
                songsToShow.push(songById)
                return songsToShow;
            }
        }
        if (searchLower.length > 0 && SongIndex) {
            const searchResults = SongIndex.search(searchLower, { limit: MAX_SEARCH_NUMBER });

            const orderedIds: number[] = [];
            const addedIds = new Set<number>();

            searchResults.forEach(fieldResult => {
                fieldResult.result.forEach(id => {
                    if (!addedIds.has(id as number)) {
                        orderedIds.push(id as number);
                        addedIds.add(id as number);
                    }
                });
            });
            //根据排序后的id结构映射为实际列表
            songsToShow = orderedIds.map(id => {
                const song = SongStore.SONG_LIST.list[id];
                if (song) {
                    return song
                } else {
                    console.warn("id", id);

                }
            }).reverse() as MaiMaiSong[];
        } else {
            // Use the static SONG_DATA
            songsToShow = SONG_DATA;
        }
        return songsToShow;
    }
    const filterByTag = (tagFilters: string[], _song?: MaiMaiSong) => {
        let songs: MaiMaiSong[] = []
        if (_song) {
            songs.push(_song)
        } else {
            // Use the static SONG_DATA
            songs = SONG_DATA;
        }
        let count = 0;
        let result: MaiMaiSong[] = []
        let success = false;
        for (const song of songs) {
            // 标签过滤
            const matchesTags = tagFilters.length === 0 ? true : tagFilters.every(tag => {
                // 定数tag过滤
                if (LEVEL_MATCH_PATTEN.test(tag)) {
                    const level_filter = conventLevelTag(tag);
                    if (level_filter) {
                        const index_key = `level_${level_filter.level_index}` as keyof MaiMaiSong;
                        const index_list = song[index_key];
                        // 将level_value转换为数字类型进行匹配
                        const numberValue = Number(level_filter.level_value);
                        const levelValue = isNaN(numberValue) ? level_filter.level_value : numberValue;
                        return Array.isArray(index_list) && index_list.includes(levelValue as never);
                    }
                }
                //范围定数过滤
                if (LEVEL_RANGE_MATCH_PATTEN.test(tag)) {
                    const indexValueList: number[] = [...song["level_0"], ...song["level_1"], ...song["level_2"], ...song["level_3"], ...song["level_4"]]
                    for (const level_value of indexValueList) {
                        const [start, end] = tag.split("-");
                        const levelStart = Number(start);
                        const levelEnd = Number(end)
                        if (level_value >= levelStart && level_value <= levelEnd) {
                            return true;
                        }
                    }
                }
                // 成绩标签过滤
                if (RANKING_MATCH_PATTEN.test(tag)) {
                    const splits = tag.split("_");
                    if (splits.length === 2) {
                        const level_index_tag = conventLevelPrefix(splits[0]);
                        const ranking_target = rankingList.find(r => r.id === splits[1]);
                        if (ranking_target) {
                            const scoreList = ScoreStore.getScoreList(song.id);
                            return scoreList.some(
                                s => s.level_index === level_index_tag &&
                                    s.achievements > ranking_target.min &&
                                    s.achievements < ranking_target.max
                            );
                        }
                    }
                }
                // 成绩范围标签过滤
                if (isValidAchievementRange(tag)) {
                    const matched = tag.match(BASE_NUMBER_RANGE_PATTEN);
                    if (!matched || matched.length !== 3) return false;
                    const start = parseFloat(matched[1]);
                    const end = parseFloat(matched[2]);
                    const scoreList = ScoreStore.getScoreList(song.id);
                    return scoreList.some(s => start <= s.achievements && end >= s.achievements);
                }
                // 旧框版本特判
                if (tag === "ALL FiNALE") {
                    return isAllFinal(song.version);
                }
                // 版本标签过滤
                const versionMatch = versionList.find(v => v.id === tag);
                if (versionMatch) {
                    return song.version === tag;
                }
                return false;
            });
            if (matchesTags) {
                success = true;
                count++;
                result.push(song)
            }
        }
        return {
            success,
            result,
            count
        }
    }
    return {
        searchSong,
        filterByTag,
        MAX_SEARCH_NUMBER
    }
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


