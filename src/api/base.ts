export interface Response<T> {
    success: boolean
    error?: string
    message: string
    details: string | any
    response?: T
}

export const request = async (url: string, options: RequestInit): Promise<Response<any>> => {
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        if (!response.ok) {
            return {
                success: false,
                error: 'Request Network Error',
                message: `请求api错误,状态码 :${response.status}`,
                details: result
            }
        }
        return {
            success: true,
            response: result.data ? result.data : result,
            message: '',
            details: ''
        }
    } catch (error) {
        return {
            success: false,
            error: 'Internal Server Error',
            message: `请求api错误 :${error instanceof Error ? error.message : 'Unknown error'}`,
            details: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}