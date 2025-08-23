import type { FishRecordResponse } from "@/types/divingfish";
import apiRouterClient from "./router";
import { createApiClient, isWebEnv } from "./base";


export const FISH_HOST = "https://www.diving-fish.com/api/maimaidxprober";
async function handleDivingFishError(response: Response) {
    const errorBody = await response.json();
    return {
        message: `DivingFish API Error: ${errorBody.message || 'Unknown error'}`,
        body: errorBody
    };
}
const fishApiClient = (token: string) => createApiClient({
    baseUrl: FISH_HOST,
    defaultHeaders: {
        "Import-Token": token
    },
    handleError: handleDivingFishError,
});
const DivingFishService = {
    queryFishUserScores: (token: string): Promise<FishRecordResponse> => {
        if (isWebEnv()) {
            return apiRouterClient(token).get<FishRecordResponse>("maimai/fish")
        }
        return fishApiClient(token).get<FishRecordResponse>(`player/records`);
    },
};

export default DivingFishService;