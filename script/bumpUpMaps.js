import SONG_DATA from "../src/assets/data/song_data_default.json" with { type: 'json' };
import path from "path";
import fs from 'fs/promises'

import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mapsCheckList = new Map();
const mapsList = []
for (const entry of Object.entries(SONG_DATA)) {
    const song = entry[1];
    if (song.map && !mapsCheckList.has(song.map)) {
        mapsCheckList.set(song.map, true);
        mapsList.push({ label: song.map, value: song.map });
    }
}
const writeFile = async () => {
    await fs.writeFile(path.resolve(__dirname, '../dev/song_maps.json'), JSON.stringify(mapsList))
}
writeFile();
