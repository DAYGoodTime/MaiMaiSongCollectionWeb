import FlexSearch, { Document, type DocumentData } from "flexsearch";
import { conventLevelPrefix, conventLevelTag, LEVEL_MATCH_PATTEN, RANKING_MATCH_PATTEN, getNoteDesigners } from "@/utils/StrUtil";
import { isAllFinal, versionList } from "@/utils/version";
import { toLXNSStyleId } from "@/utils/functionUtil";
import { rankingList } from "@/utils/urlUtils";
import { toHiragana } from "wanakana";
import type { MaiMaiSong } from "@/types/songs";
import { ref } from "vue";
import { useDataStore } from "@/store/datasource";

export const MAX_SEARCH_NUMBER = 100;
// 在模块作用域创建一次，这是实现单例的关键
let songIndex: Document<DocumentData, boolean, boolean> | null = null;
const isIndexing = ref(false);
let SONG_DATA: MaiMaiSong[] = []

export const useSongSearch = () => {
    let songMap = new Map();
    const { getSongDataList, getScoreList } = useDataStore()
    if (!songIndex && !isIndexing.value) {
        isIndexing.value = true;
        SONG_DATA = getSongDataList.list
        songMap = new Map<number, MaiMaiSong>(SONG_DATA.map(s => [s.id, s]))
        const promise = new Promise<Document<DocumentData, boolean, boolean>>((resolve) => {
            //歌曲索引
            let songIndex = new FlexSearch.Document({
                document: {
                    id: 'id',
                    index: [
                        { field: 'title', tokenize: 'forward', priority: 10 },
                        { field: 'titleHiragana', tokenize: 'forward', priority: 9 },
                        { field: 'aliasesLower', tokenize: 'forward', priority: 8 },
                        { field: 'artist', tokenize: 'forward', priority: 5 },
                        { field: 'artistHiragana', tokenize: 'forward', priority: 4 },
                        { field: 'noteDesigners', tokenize: 'forward', priority: 1 }
                    ]
                },
            });
            //添加索引
            SONG_DATA.forEach(song => {
                const indexedDoc = {
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    titleHiragana: toHiragana(song.title).toLowerCase(),
                    artistHiragana: toHiragana(song.artist).toLowerCase(),
                    aliasesLower: song.aliases?.join(" ").toLowerCase() || "",
                    noteDesigners: getNoteDesigners(song)
                };
                songIndex.add(indexedDoc);
            });
            isIndexing.value = false
            resolve(songIndex)
        })
        promise.then(index => songIndex = index)
    }
    const searchSong = (keyword: string) => {
        const searchLower = toHiragana(keyword.toLowerCase());
        const searchNumber = !isNaN(Number(keyword)) ? toLXNSStyleId(Number(keyword)) : null;
        let songsToShow: MaiMaiSong[] = [];
        if (searchNumber !== null) {
            // 如果搜索为id，则直接映射
            const songById = songMap.get(searchNumber);
            if (songById) {
                const existingIndex = songsToShow.findIndex(s => s.id === searchNumber);
                if (existingIndex !== -1) {
                    songsToShow.splice(existingIndex, 1);
                }
                songsToShow.unshift(songById);
                return songsToShow;
            }
        }
        if (searchLower.trim().length > 0 && songIndex) {
            const searchResults = (songIndex as Document).search(searchLower, { limit: MAX_SEARCH_NUMBER });
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



