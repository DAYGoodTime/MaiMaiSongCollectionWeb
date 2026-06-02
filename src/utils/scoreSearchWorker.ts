import type { ScoreExtend } from "@/types/songs";
import FlexSearch, { Document } from "flexsearch";
import { pinyin } from "pinyin-pro";
import { getNoteDesignerWithId } from "./StrUtil";

let scoreIndex: Document<ScoreIndexDoc>;
let scoreMap = new Map<string, ScoreExtend>();
let ready = false;

self.onmessage = ({ data }) => {
    const { type, payload } = data
    switch (type) {
        case 'init': init(payload); break;
        case 'search': searchScores(payload); break;
        default: console.warn(`scoreWorkers:未知的指令 ${type}`);
    }
}
interface ScoreIndexDoc {
    [key: string]: any,
    score_id: string,
    title: string,
    titlePinYin: string,
    artist: string,
    aliases: string[],
    aliasesPinYin: string[],
    noteDesigners: string[],
    score_obj: ScoreExtend
}
const init = (scoreList: ScoreExtend[]) => {
    ready = false;
    if (scoreIndex) scoreIndex.clear();
    scoreMap.clear();
    scoreMap = new Map<string, ScoreExtend>(scoreList.map(s => [s.score_id, s]));
    scoreIndex = new FlexSearch.Document<ScoreIndexDoc>({
        document: {
            id: 'score_id',
            index: [
                { field: 'title', priority: 10 },
                { field: 'titlePinYin', priority: 9 },
                { field: 'aliases', priority: 8 },
                { field: 'aliasesPinYin', priority: 7 },
                { field: 'artist', priority: 5 },
                { field: 'noteDesigners', priority: 3 }
            ],
            store: ["score_obj"],//"title", "titlePinYin", "aliases", "aliasesPinYin", "artist", "noteDesigners" for debugging

        },
        preset: 'score',
        tokenize: 'full',
    });
    scoreList.forEach(item => {
        const { song, score_id } = item;
        const aliasesPinYinSet = new Set<string>()
        if (Array.isArray(song.aliases)) {
            for (const alias of song.aliases) {
                const py = pinyin(alias as string, { toneType: 'none', nonZh: "removed", separator: "", v: true });
                if (py.length > 0) {
                    aliasesPinYinSet.add(py)
                }
            }
        }
        const indexedDoc: ScoreIndexDoc = {
            score_id: score_id,
            title: song.title,
            titlePinYin: pinyin(song.title, { toneType: 'none', nonZh: "removed", separator: "", v: true }),
            artist: song.artist,
            aliases: song.aliases ?? [""],
            aliasesPinYin: [...aliasesPinYinSet],
            noteDesigners: getNoteDesignerWithId(song, score_id),
            score_obj: item
        };
        scoreIndex.add(indexedDoc);
    });
    self.postMessage({ type: 'ready' });
    ready = true;
}

const searchScores = (input: string) => {
    if (!ready || input.trim().length === 0 || !scoreIndex) {
        self.postMessage({ type: 'search_results', results: Array.from(scoreMap.values()) });
        return;
    }
    const searchLower = input.trim().toLowerCase();
    const searchResults = scoreIndex.search(searchLower, { enrich: true });
    const scoresToShow: ScoreExtend[] = []
    const idMap = new Map<string, boolean>()
    searchResults.forEach(field => {
        field.result.forEach(doc => {
            if (!idMap.has(doc.id as string) && doc.doc) {
                scoresToShow.push(doc.doc.score_obj)
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
    //                     match: result.doc[r.field as keyof ScoreIndexDoc]
    //                 }
    //             } else return ""
    //         })
    //     }
    //     return obj
    // }));
    // console.log("result", scoresToShow);

    // scoresToShow = orderedIds.map(id => scoreMap.get(id)).filter(Boolean) as ScoreExtend[];
    self.postMessage({ type: 'search_results', results: scoresToShow });
}