import type { MaiMaiSong } from "@/types/songs";
import FlexSearch, { Document, type DocumentData } from "flexsearch";
import { pinyin } from "pinyin-pro";
import { getNoteDesigners } from "./StrUtil";
import { toLXNSStyleId } from "./functionUtil";
import { MAX_SEARCH_NUMBER } from "./consts";

let songIndex: Document<DocumentData, boolean, boolean> | null = null;
let SONG_MAP: Record<number, MaiMaiSong> | null = null;
let SONG_LIST: MaiMaiSong[] = []
let ready = false;
let searchLimit = MAX_SEARCH_NUMBER
const WARN_LIMIT = 10;

self.onmessage = ({ data }) => {
    const { type, payload } = data

    switch (type) {
        case 'init': {
            const { records, searchLimit } = payload
            init(records, searchLimit);
            break;
        }
        case 'search': {
            const onlyText = typeof payload === 'string'
            const input = onlyText ? payload : payload.input
            const search_limit = (!onlyText && "searchLimit" in payload) ? payload.searchLimit : void 0;
            searchSongs(input, search_limit);
            break;
        }
        default: console.warn(`scoreWorkers:未知的指令 ${type}`);
    }
}

const init = (songMap: Record<number, MaiMaiSong>, limit: number) => {
    if (!isNaN(limit)) searchLimit = Number(limit)
    SONG_MAP = songMap;
    //to List
    SONG_LIST = []
    for (const entry of Object.entries(songMap)) {
        SONG_LIST.push(entry[1])
    }
    ready = false;
    if (songIndex) songIndex.clear();
    songIndex = new FlexSearch.Document({
        document: {
            id: 'id',
            index: [
                { field: 'title', tokenize: 'forward', preset: 'match', priority: 10 },
                { field: 'titlePinYin', tokenize: 'forward', preset: 'match', priority: 8 },
                { field: 'aliasesLower', tokenize: 'forward', priority: 8 },
                { field: 'aliasesPinYin', tokenize: 'forward', priority: 7 },
                { field: 'artist', tokenize: 'forward', priority: 6 },
                { field: 'noteDesigners', tokenize: 'forward', preset: 'match', priority: 9 }
            ]
        }
    })
    for (const song of SONG_LIST) {
        const noteDesigners = getNoteDesigners(song)
        const indexedDoc = {
            id: song.id,
            title: song.title.toLocaleLowerCase(),
            titlePinYin: pinyin(song.title, { toneType: 'none', nonZh: "removed", separator: "", v: true }),
            artist: song.artist,
            aliasesLower: song.aliases?.join(" ").toLowerCase() || "",
            aliasesPinYin: song.aliases?.flatMap(v => {
                const py = pinyin(v as string, { toneType: 'none', nonZh: "removed", separator: "", v: true });
                return py ? [py] : []
            }) || [],
            noteDesigners,
        };
        songIndex.add(indexedDoc)
    }
    self.postMessage({ type: 'ready' });
    ready = true;
}

const searchSongs = (input: string, search_limit?: number) => {
    const SearchLimit = search_limit ?? searchLimit
    if (!ready || input.trim().length === 0 || !songIndex) {
        self.postMessage({ type: 'search_results', results: SONG_LIST });
        return;
    }
    const searchLower = input.trim().toLowerCase();
    const searchNumber = !isNaN(Number(input)) ? toLXNSStyleId(Number(input)) : null;
    let songsToShow: MaiMaiSong[] = [];
    if (searchNumber !== null && SONG_MAP) {
        // 如果搜索为id，则直接映射
        const songById = SONG_MAP[searchNumber]
        // 若存在对应id则直接返回结果
        if (songById) {
            songsToShow.push(songById)
            self.postMessage({ type: 'search_results', results: songsToShow });
            return
        }
    }
    const searchResults = (songIndex as Document).search(searchLower, { limit: SearchLimit });
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
    //根据排序后的id结构映射为实际列表
    let warn_count = 0;
    songsToShow = orderedIds.map(id => {
        if (SONG_MAP) {
            const song = SONG_MAP[Number(id)];
            if (song) {
                return song
            } else {
                if (warn_count <= WARN_LIMIT) {
                    console.warn("有无法对应的歌曲id", id);
                    warn_count++;
                }
            }
        }

    }).reverse() as MaiMaiSong[];
    self.postMessage({ type: 'search_results', results: songsToShow });
}