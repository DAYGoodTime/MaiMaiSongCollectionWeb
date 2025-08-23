import { Capacitor } from "@capacitor/core";
export interface ApiClientConfig {
    baseUrl: string;
    defaultHeaders?: Record<string, string>;
    getDynamicHeaders?: () => Promise<Record<string, string>>;
    handleError?: (response: Response) => Promise<any>;
}
export class HttpError extends Error {
    status: number;
    data: any;
    constructor(status: number, message: string, data?: any) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.data = data
    }
    toJSON() {
        return {
            name: this.name,
            status: this.status,
            message: this.message,
            data: this.data
        }
    }
}
export function createApiClient(config: ApiClientConfig) {
    return {
        async request<T>(
            endpoint: string,
            options: RequestInit = {}
        ): Promise<T> {
            const url = `${config.baseUrl}/${endpoint}`;

            const dynamicHeaders = config.getDynamicHeaders
                ? await config.getDynamicHeaders()
                : {};

            const finalHeaders = {
                'Content-Type': 'application/json',
                ...config.defaultHeaders,
                ...dynamicHeaders,
                ...options.headers,
            };

            const finalOptions: RequestInit = {
                ...options,
                headers: finalHeaders,
            };

            const response = await fetch(url, finalOptions);

            if (!response.ok) {
                if (config.handleError) {
                    // custom handler
                    const errorData = await config.handleError(response);
                    throw new HttpError(response.status, errorData.message || 'An error occurred', errorData);
                }

                // 默认错误处理逻辑
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
                throw new HttpError(response.status, errorData.message || response.statusText, errorData);
            }

            if (response.status === 204) {
                return null as T;
            }

            return response.json() as Promise<T>;
        },

        get<T>(endpoint: string, options?: RequestInit): Promise<T> {
            return this.request<T>(endpoint, { ...options, method: 'GET' });
        },
        post<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
            return this.request<T>(endpoint, {
                ...options,
                method: 'POST',
                body: JSON.stringify(body),
            });
        },
    };
}
export type ApiClient = ReturnType<typeof createApiClient>;
export function isWebEnv() {
    return Capacitor.getPlatform() === "web";
}
