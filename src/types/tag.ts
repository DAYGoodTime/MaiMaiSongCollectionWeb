export interface DiffTAG {
    id: number,
    localized_name: LocalizedValue
    localized_description: LocalizedValue
    group_id: number
}
export interface TAGGroup {
    id: number,
    localized_name: LocalizedValue
    color: string
}
export interface DiffTAGInfo {
    song_id: string,
    sheet_type: SongType,
    sheet_difficulty: SheetDifficulty
    tag_id: number
}
export interface GroupInfo {
    group: TAGGroup
    tags: Array<DiffTAG>
}
export interface GroupInfoForCounter {
    group: TAGGroup
    tags: Array<DiffTagCounter>,
    total: number
}
export interface DiffTagCounter {
    tag: DiffTAG,
    count: number
}

export type SongType = "std" | "dx"
export type SheetDifficulty = "master" | "remaster" | "expert" | "advanced" | "basic"
type LocalizedValue = {
    "zh-Hans": string
    "en"?: string
}


export interface TAGJSON {
    tags: Array<DiffTAG>
    tagGroups: Array<TAGGroup>
    tagSongs: Array<DiffTAGInfo>
}