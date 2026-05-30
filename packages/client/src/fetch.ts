import config from "./config";

// 批量API响应接口
export interface BatchGetCountersAPIResponse {
    code: number;
    message?: string;
    data?: Array<{
        mark: string;
        num: number;
    }>;
}

// 批量设置计数器请求接口
export interface BatchSetCounterRequest {
    siteId: string;
    counters: Array<{
        mark: string;
        increment: number;
    }>;
}
// 批量设置计数器响应接口
export interface BatchSetCounterResponse {
    code: number;
    message?: string;
    data?: Array<{
        mark: string;
        num: number;
    }>;
}
/**
 * 评论数据接口
 */
export interface CommentData {
    id?: number;
    username: string;
    email: string;
    url?: string;
    avatar?: string;
    content: string;
    mark: string;
    siteId: string;
    parent?: number | string;
    ip?: string;
    location?: string;
    ua?: string;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: number;
        username: string;
        email?: string;
        url?: string;
        avatar?: string;
    };
}

/**
 * 评论提交响应接口
 */
export interface CommentSubmitResponse {
    code: number;
    msg: string;
    data?: {
        id: string;
    };
}

/**
 * 评论列表响应接口
 */
export interface CommentListResponse {
    code: number;
    msg?: string;
    message?: string;
    data?: CommentData[];
    total?: number;
    page?: number;
    pageSize?: number;
    pageCount?: number;
}

type CommentListPayload = {
    data?: CommentData[];
    total?: number;
    page?: number;
    pageSize?: number;
    pageCount?: number;
};

const normalizeCommentListResponse = (result: Record<string, unknown>): CommentListResponse => {
    const payload = (result.data && typeof result.data === 'object' ? result.data : null) as CommentListPayload | null;
    const responseData = Array.isArray(result.data)
        ? result.data as CommentData[]
        : Array.isArray(payload?.data)
            ? payload?.data
            : [];

    return {
        code: typeof result.code === 'number' ? result.code : 500,
        msg: typeof result.msg === 'string' ? result.msg : (typeof result.message === 'string' ? result.message : ''),
        message: typeof result.message === 'string' ? result.message : (typeof result.msg === 'string' ? result.msg : ''),
        data: responseData,
        total: typeof result.total === 'number' ? result.total : payload?.total,
        page: typeof result.page === 'number' ? result.page : payload?.page,
        pageSize: typeof result.pageSize === 'number' ? result.pageSize : payload?.pageSize,
        pageCount: typeof result.pageCount === 'number' ? result.pageCount : payload?.pageCount,
    };
};



export const fetchCountersBatch = async (keys: string[]): Promise<Map<string, number | null>> => {
    const result = new Map<string, number | null>();

    if (keys.length === 0) {
        return result;
    }

    // 验证配置
    if (!config.apiBaseUrl) {
        console.error('Marku Counter: apiBaseUrl is required for fetchCountersBatch');
        keys.forEach(key => {
            result.set(key, null);
        });
        return result;
    }
    if (!config.siteId) {
        console.error('Marku Counter: siteId is required for fetchCountersBatch');
        keys.forEach(key => {
            result.set(key, null);
        });
        return result;
    }

    try {
        const url = new URL('/api/count/batch', config.apiBaseUrl);

        const requestBody = {
            siteId: config.siteId,
            marks: keys
        };

        const controller = new AbortController();
        // 10s超时
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: BatchGetCountersAPIResponse = await response.json();

        console.log('Marku Counter: Batch API response', data);

        // 检查API响应格式
        if (data.code === 200 && data.data) {
            // 将响应数据转换为Map
            data.data.forEach(item => {
                result.set(item.mark, item.num || 0);
            });

            // 为未返回的key设置默认值0
            keys.forEach(key => {
                if (!result.has(key)) {
                    result.set(key, 0);
                }
            });
        } else {
            // 请求失败，所有key都设置为null
            keys.forEach(key => {
                result.set(key, null);
            });
        }
    } catch (error) {
        console.error('Marku Counter: Failed to fetch counters batch:', error);
        // 错误情况下，所有key都设置为null
        keys.forEach(key => {
            result.set(key, null);
        });
    }

    return result;
}

export const setCountersBatch = async (counters: Array<{ mark: string; increment: number }>): Promise<boolean> => {
    if (counters.length === 0) {
        return true;
    }

    // 验证配置
    if (!config.apiBaseUrl) {
        console.error('Marku Counter: apiBaseUrl is required for submitCountersBatch');
        return false;
    }

    if (!config.siteId) {
        console.error('Marku Counter: siteId is required for submitCountersBatch');
        return false;
    }

    try {
        const url = new URL('/api/increment/batch', config.apiBaseUrl);

        const requestBody: BatchSetCounterRequest = {
            siteId: config.siteId,
            counters: counters
        };

        const controller = new AbortController();
        // 10s超时
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: BatchSetCounterResponse = await response.json();

        console.log('Marku Counter: Batch set API response', data);

        // 检查API响应格式
        if (data.code === 200) {
            return true;
        } else {
            console.error('Marku Counter: API returned error:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Marku Counter: Failed to submit counters batch:', error);
        return false;
    }
}

export const submitComment = async (commentData: CommentData): Promise<CommentSubmitResponse | null> => {
    if (!config.apiBaseUrl) {
        console.error('Marku Comment: apiBaseUrl is required');
        return null;
    }

    if (!config.siteId) {
        console.error('Marku Comment: siteId is required for submitComment');
        return null;
    }


    try {
        const url = new URL('/api/comment/submit', config.apiBaseUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('Marku Comment: HTTP error', response.status, response.statusText);
            return null;
        }

        const result: CommentSubmitResponse = await response.json();

        if (result.code === 200) {
            console.log('Marku Comment: Submit success', result);
            return result;
        } else {
            console.error('Marku Comment: Submit failed', result.msg);
            return null;
        }
    } catch (error) {
        console.error('Marku Comment: Network error', error);
        return null;
    }
}

export const fetchComments = async (key: string, page = 1, pageSize = 10): Promise<CommentListResponse> => {
    if (!config.apiBaseUrl) {
        console.error('Marku Comment: apiBaseUrl is required');
        return {
            code: 400,
            msg: 'apiBaseUrl is required',
            data: []
        };
    }

    if (!config.siteId) {
        console.error('Marku Comment: siteId is required for fetchComments');
        return {
            code: 400,
            msg: 'siteId is required',
            data: []
        };
    }

    try {
        const url = new URL('/api/comment/list', config.apiBaseUrl);
        url.searchParams.append('siteId', config.siteId);
        url.searchParams.append('key', key);
        url.searchParams.append('page', String(page));
        url.searchParams.append('pageSize', String(pageSize));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url.toString(), {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('Marku Comment: HTTP error', response.status, response.statusText);
            return {
                code: response.status,
                msg: response.statusText,
                data: []
            };
        }

        const result = normalizeCommentListResponse(await response.json());

        if (result.code === 200) {
            console.log('Marku Comment: Fetch success', result);
            return result;
        } else {
            console.error('Marku Comment: Fetch failed', result.msg || result.message);
            return {
                code: result.code,
                msg: result.msg || result.message || 'Fetch failed',
                data: []
            };
        }
    } catch (error) {
        console.error('Marku Comment: Network error', error);
        return {
            code: 500,
            msg: 'Network error',
            data: []
        };
    }
}
