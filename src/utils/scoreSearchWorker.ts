import type { ScoreExtend } from "@/types/songs";
import FlexSearch, { Document, type DocumentData } from "flexsearch";
import { pinyin } from "pinyin-pro";
import { getNoteDesigners } from "./StrUtil";

let scoreIndex: Document<DocumentData, boolean, boolean> | null = null;
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

const init = (scoreList: ScoreExtend[]) => {
    ready = false;
    if (scoreIndex) scoreIndex.clear();
    scoreMap.clear();
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
    self.postMessage({ type: 'ready' });
    ready = true;
}

const searchScores = (input: string) => {
    if (!ready || input.trim().length === 0 || !scoreIndex) {
        self.postMessage({ type: 'search_results', results: Array.from(scoreMap.values()) });
        return;
    }
    const searchLower = input.trim().toLowerCase();
    const searchResults = (scoreIndex as Document).search(searchLower);
    let scoresToShow: ScoreExtend[] = []
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
    self.postMessage({ type: 'search_results', results: scoresToShow });
}