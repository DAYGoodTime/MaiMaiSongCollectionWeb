import FlexSearch, { Document, type DocumentData } from "flexsearch";
import { conventLevelPrefix, conventLevelTag, LEVEL_MATCH_PATTEN, RANKING_MATCH_PATTEN, getNoteDesigners, getLevelValue } from "@/utils/StrUtil";
import { isAllFinal, versionList } from "@/utils/version";
import { toLXNSStyleId } from "@/utils/functionUtil";
import { rankingList } from "@/utils/urlUtils";
import type { MaiMaiSong, ScoreExtend } from "@/types/songs";
import { useDataStore } from "@/store/datasource";
import type { AdvanceFilterFilters } from "@/types/component";
import { useAppStore } from "@/store/appStore";
import { toRaw } from "vue";
import { pinyin } from "pinyin-pro";

export interface OrderBadge {
    label: string,
    value: string,
    status_index: number
}

export const MAX_SEARCH_NUMBER = 100;

let SONG_DATA: MaiMaiSong[] = []

export const useSongSearch = () => {
    const appStore = useAppStore();
    const SongIndex = toRaw(appStore.SongIndex)
    let songMap = new Map();
    const { getSongDataList, getScoreList } = useDataStore()
    SONG_DATA = getSongDataList.list
    songMap = new Map<number, MaiMaiSong>(SONG_DATA.map(s => [s.id, s]))
    const searchSong = (keyword: string) => {
        const searchLower = keyword.toLowerCase().trim();
        const searchNumber = !isNaN(Number(keyword)) ? toLXNSStyleId(Number(keyword)) : null;
        let songsToShow: MaiMaiSong[] = [];
        if (searchNumber !== null) {
            // 如果搜索为id，则直接映射
            const songById = songMap.get(searchNumber);
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
            songsToShow = orderedIds.map(id => songMap.get(id)).filter(Boolean) as MaiMaiSong[];
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

                // 成绩标签过滤
                if (RANKING_MATCH_PATTEN.test(tag)) {
                    const splits = tag.split("_");
                    if (splits.length === 2) {
                        const level_index_tag = conventLevelPrefix(splits[0]);
                        const ranking_target = rankingList.find(r => r.id === splits[1]);
                        if (ranking_target) {
                            const scoreList = getScoreList(song.id);
                            return scoreList.some(
                                s => s.level_index === level_index_tag &&
                                    s.achievements > ranking_target.min &&
                                    s.achievements < ranking_target.max
                            );
                        }
                    }
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
        MAX_SEARCH_NUMBER,
        SONG_DATA
    }
}
export const useScoreSearch = () => {
    let scoreIndex: Document<DocumentData, boolean, boolean> | null = null;
    let scoreMap = new Map<string, ScoreExtend>();

    const updateIndex = (scoreList: ScoreExtend[]) => {
        scoreMap = new Map<string, ScoreExtend>(scoreList.map(s => [s.score_id, s]));
        scoreIndex = new FlexSearch.Document({
            document: {
                id: 'score_id',
                index: [
                    { field: 'title', tokenize: 'forward', priority: 10 },
                    { field: 'titlePinYin', tokenize: 'forward', priority: 9 },
                    { field: 'aliasesLower', tokenize: 'forward', priority: 8 },
                    { field: 'aliasesPinYin', tokenize: 'forward', priority: 7 },
                    { field: 'artist', tokenize: 'forward', priority: 5 },
                    { field: 'noteDesigners', tokenize: 'forward', priority: 1 }
                ]
            },
        });
        scoreList.forEach(item => {
            const { song, score_id } = item;
            const aliasesPinYin = []
            if (Array.isArray(song.aliases)) {
                for (const alias of song.aliases) {
                    const py = pinyin(alias as string, { toneType: 'none', nonZh: "removed", separator: "", v: true });
                    if (py.length > 0) {
                        aliasesPinYin.push(py)
                    }
                }
            }
            const indexedDoc = {
                score_id: score_id,
                title: song.title,
                titlePinYin: pinyin(song.title, { toneType: 'none', nonZh: "removed", separator: "", v: true }),
                artist: song.artist,
                aliasesLower: song.aliases?.join(" ").toLowerCase() || "",
                aliasesPinYin,
                noteDesigners: getNoteDesigners(song)
            };
            (scoreIndex as Document).add(indexedDoc);
        });
    }

    const searchScore = (keyword: string) => {
        if (!scoreIndex || !keyword) return Array.from(scoreMap.values());
        const searchLower = keyword.toLowerCase().trim();
        let scoresToShow: ScoreExtend[] = [];

        if (searchLower.length > 0) {
            const searchResults = (scoreIndex as Document).search(searchLower);
            const orderedIds: string[] = [];
            const addedIds = new Set<string>();

            searchResults.forEach(fieldResult => {
                fieldResult.result.forEach(id => {
                    if (!addedIds.has(id as string)) {
                        orderedIds.push(id as string);
                        addedIds.add(id as string);
                    }
                });
            });
            scoresToShow = orderedIds.map(id => scoreMap.get(id)).filter(Boolean) as ScoreExtend[];
        } else {
            scoresToShow = Array.from(scoreMap.values());
        }
        return scoresToShow;
    }
    const orderBy = (list: ScoreExtend[], orderBy: OrderBadge) => {
        let ordered = [...list];
        switch (orderBy.value) {
            case 'achievement':
                ordered = ordered.sort((a, b) => {
                    if (orderBy.status_index == 2) {
                        return a.score.achievements - b.score.achievements
                    } else {
                        return b.score.achievements - a.score.achievements
                    }
                });
                break;
            case 'dx_rating':
                ordered = ordered.sort((a, b) => {
                    if (orderBy.status_index == 2) {
                        return a.score.dx_rating - b.score.dx_rating
                    } else {
                        return b.score.dx_rating - a.score.dx_rating
                    }
                });
                break;
            case 'level':
                ordered = ordered.sort((a, b) => {
                    if (orderBy.status_index == 2) {
                        return getLevelValue(a) - getLevelValue(b)
                    } else {
                        return getLevelValue(b) - getLevelValue(a)
                    }
                });
                break;
            case 'play_count':
                if (ordered.length > 1 && (ordered[0].score.play_count || ordered[0].score.play_count != 0)) {
                    ordered = ordered.sort((a, b) => {
                        if (orderBy.status_index == 2) {
                            return (a.score.play_count ?? 0) - (b.score.play_count ?? 0)
                        } else {
                            return (b.score.play_count ?? 0) - (a.score.play_count ?? 0)
                        }
                    });
                }
                break;
        }
        return ordered;
    }
    const advanceFilter = (filter: AdvanceFilterFilters, list: ScoreExtend[]): ScoreExtend[] => {
        let result = list;
        //level
        const level_filter = filter.difficulty.map(f => f.value);
        if (level_filter.length > 0) {
            result = result.filter(s => level_filter.includes(s.score.level_index))
        }
        //categories
        const category_filter = filter.musicCategories.map(f => f.value)
        if (category_filter.length > 0) {
            result = result.filter(s => category_filter.includes(s.song.genre ?? ""))
        }
        //version
        const version_filter = filter.version.map(f => f.value)
        if (version_filter.length > 0) {
            result = result.filter(s => version_filter.includes(s.song.version))
        }
        //map
        const map_filter = filter.mapCategories.map(f => f.value);
        if (map_filter.length > 0) {
            result = result.filter(s => map_filter.includes(s.song.map ?? ""))
        }
        //level_value_rang
        result = result.filter(s => {
            //非宴谱才可以计算
            if (s.score.type !== "utage" && s.score.level_value) {
                return s.score.level_value >= filter.difficultyRange[0] && s.score.level_value <= filter.difficultyRange[1]
            }
            return false;
        })
        //fc
        const fc_filter = filter.fullCombo.map(f => f.value);
        if (fc_filter.length > 0) {
            result = result.filter(s => fc_filter.includes(s.score.fc ?? "NAN"))
        }
        //fs
        const fs_filter = filter.fullSync.map(f => f.value);
        if (fs_filter.length > 0) {
            result = result.filter(s => fs_filter.includes(s.score.fs ?? "NAN"))
        }
        //type
        const type_filter = filter.Type.map(f => f.value);
        if (type_filter.length == 1) {
            result = result.filter(s => type_filter.includes(s.score.type))
        }
        //unplayed
        if (!filter.showUnplayed) {
            result = result.filter(s => s.score.is_played !== false)
        }
        return result;
    }
    return {
        searchScore,
        updateIndex,
        orderBy,
        advanceFilter
    }
}



