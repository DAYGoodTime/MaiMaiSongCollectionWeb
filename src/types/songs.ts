import type { Score } from "./datasource";
export interface MaiMaiSong {
  id: number;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  map: string | null;
  version: string;
  rights: string | null;
  aliases: Array<String>;
  disabled: boolean;
  difficulties: {
    standard: SongDifficulty[];
    dx: SongDifficulty[];
    utage: SongDifficulty[];
  };
  level_0: any[];
  level_1: any[];
  level_2: any[];
  level_3: any[];
  level_4: any[];
};
export interface SongDifficulty {
  type: SongType;
  level: string;
  level_value: number;
  level_index: number;
  note_designer: string;
  version: number;
  tap_num: number;
  hold_num: number;
  slide_num: number;
  touch_num: number;
  break_num: number;
  curve?: null;
  kanji?: string;
  description?: string;
  is_buddy?: boolean;
};
export interface ScoreExtend {
  score: Score;
  song: MaiMaiSong;
  score_id: string
}
export type SongType = "standard" | "dx" | "utage"