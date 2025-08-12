import type { FishRecordResponse } from "@/types/divingfish";
import { request, type Response } from "./base";


export const FISH_HOST = "https://www.diving-fish.com/api/maimaidxprober";


export const queryFishUserScores = (token: string): Promise<Response<FishRecordResponse>> => {
    // 准备请求头
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Import-Token': token
    };
    const url = `${FISH_HOST}/player/records`
    const requestOption: RequestInit = {
        method: 'GET',
        headers,
    }
    return request(url, requestOption)
}