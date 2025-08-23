import { createApiClient } from "./base";
// 用于中转请求的
export const API_ROUTER_HOST = import.meta.env.VITE_API_BASE_URL

async function handleRouterError(response: Response) {
    const errorBody = await response.json();
    return {
        message: `Router API Error: ${errorBody.detail || 'Unknown error'}`,
        body: errorBody
    };
}
const apiRouterClient = (auth?: string) => {
    return createApiClient({
        baseUrl: API_ROUTER_HOST,
        defaultHeaders: {
            "authorization": auth ?? ""
        },
        handleError: handleRouterError,
    });
}
export default apiRouterClient;