import type { UsagiScore } from "@/types/usagi"
import { request, type Response } from "./base"

export const rateMapping = ["sssp", "sss", "ssp", "ss", "sp", "s", "aaa", "aa", "a", "bbb", "bb", "b", "c", "d"]
export const fcMapping = ["app", "ap", "fcp", "fc"]
export const fsMapping = ["sync", "fs", "fsp", "fsd", "fsdp"]

const HOST = "https://uc.turou.fun/api/maimai/v1"
const DEV_TOKEN = import.meta.env.VITE_USAGI_DEV_TOKEN

export const queryUsagiUserScore = (uuid: String): Promise<Response<UsagiScore[]>> => {
    if (uuid.length === 0) {
        throw new Error("uuid is empty")
    }
    // 准备请求头
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-developer-token': DEV_TOKEN
    };
    const url = `${HOST}/scores?uuid=${uuid}`
    const requestOption: RequestInit = {
        method: 'GET',
        headers,
    }
    return request(url, requestOption)
}