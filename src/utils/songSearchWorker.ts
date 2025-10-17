import type { MaiMaiSong } from "@/types/songs";
import FlexSearch, { Document } from "flexsearch";
import { pinyin } from "pinyin-pro";
import { getNoteDesigners } from "./StrUtil";
import { toLXNSStyleId } from "./functionUtil";
import { MAX_SEARCH_NUMBER } from "./consts";

interface SongIndexDoc {
    [key: string]: any,
    title: string
    titlePinYin: string
    aliases: string[]
    aliasesPinYin: string[]
    artist: string
    noteDesigners: string[],
    song_obj: MaiMaiSong
}

let songIndex: Document<SongIndexDoc>;
let SONG_MAP: Record<number, MaiMaiSong> | null = null;
let SONG_LIST: MaiMaiSong[] = []
let ready = false;
let searchLimit = MAX_SEARCH_NUMBER

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
                { field: 'title', priority: 10 },
                { field: 'titlePinYin', priority: 9 },
                { field: 'aliases', priority: 8 },
                { field: 'aliasesPinYin', priority: 7 },
                { field: 'artist', priority: 6 },
                { field: 'noteDesigners', priority: 5 }
            ],
            store: ["song_obj"]//"title", "titlePinYin", "aliases", "aliasesPinYin", "artist", "noteDesigners" for debugging
        },
        preset: 'score',
        tokenize: 'full'
    })
    for (const song of SONG_LIST) {
        const noteDesigners = getNoteDesigners(song)
        const aliasesPYSet = new Set<string>();
        if (Array.isArray(song.aliases)) {
            song.aliases.forEach(a => {
                const py = pinyin(a as string, { toneType: 'none', nonZh: "removed", separator: "", v: true })
                if (py.length > 0) aliasesPYSet.add(py)
            })
        }
        const indexedDoc = {
            id: song.id,
            title: song.title.toLocaleLowerCase(),
            titlePinYin: pinyin(song.title, { toneType: 'none', nonZh: "removed", separator: "", v: true }),
            artist: song.artist,
            aliases: song.aliases ?? [],
            aliasesPinYin: [...aliasesPYSet],
            noteDesigners,
            song_obj: song
        };
        songIndex.add(indexedDoc)
    }
    self.postMessage({ type: 'ready' });
    ready = true;
}

const searchSongs = (input: string, search_limit?: number) => {
    const SearchLimit = search_limit ?? searchLimit
    if (!ready || input.trim().length === 0 || !songIndex) {
        self.postMessage({ type: 'search_results', results: [...SONG_LIST].reverse() });
        return;
    }
    const searchLower = input.trim().toLowerCase();
    const searchNumber = !isNaN(Number(input)) ? toLXNSStyleId(Number(input)) : null;
    const songsToShow: MaiMaiSong[] = [];
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
    const searchResults = songIndex.search(searchLower, { limit: SearchLimit, enrich: true });
    // const orderedIds: string[] = [];
    // const addedIds = new Set<string>();
    // searchResults.forEach(fieldResult => {
    //     fieldResult.result.forEach(id => {
    //         if (!addedIds.has(id as string)) {
    //             orderedIds.push(id as string);
    //             addedIds.add(id as string);
    //         }
    //     });
    // });
    // //根据排序后的id结构映射为实际列表
    // let warn_count = 0;
    // songsToShow = orderedIds.map(id => {
    //     if (SONG_MAP) {
    //         const song = SONG_MAP[Number(id)];
    //         if (song) {
    //             return song
    //         } else {
    //             if (warn_count <= WARN_LIMIT) {
    //                 console.warn("有无法对应的歌曲id", id);
    //                 warn_count++;
    //             }
    //         }
    //     }

    // }).reverse() as MaiMaiSong[];
    const idMap = new Map<string, boolean>()
    searchResults.forEach(field => {
        field.result.forEach(doc => {
            if (!idMap.has(doc.id as string) && doc.doc) {
                songsToShow.push(doc.doc.song_obj)
                idMap.set(doc.id as string, true)
            }
        })
    })

    // Still need to testing result is good enough
    // console.log("reason", searchResults.map(r => {
    //     let obj = {
    //         field: r.field,
    //         matching: r.result.map(result => {
    //             if (result.doc) {
    //                 return {
    //                     title: result.doc.title,
    //                     match: result.doc[r.field as keyof SongIndexDoc]
    //                 }
    //             } else return ""
    //         })
    //     }
    //     return obj
    // }));
    // console.log("result", songsToShow);
    self.postMessage({ type: 'search_results', results: songsToShow });
}