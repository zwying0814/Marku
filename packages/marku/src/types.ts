// 模块配置接口
export interface CountConfig {
    siteId: string;
    apiBaseUrl: string;
    includeQuery: boolean;
}

// Config类配置选项接口
export interface ConfigOptions {
    siteId?: string;
    apiBaseUrl?: string;
    includeQuery?: boolean;
}

// 批量API响应接口
export interface BatchAPIResponse {
    code: number;
    message?: string;
    data?: Array<{
        key: string;
        num: number;
    }>;
}

// 自定义事件详情接口
export interface CounterEventDetail {
    key: string;
    count?: number;
}

// 设置计数器数据接口
export interface SetCounterData {
    siteId: string;
    url: string;
    key: string;
    increment: number;
}

// 批量设置计数器请求接口
export interface BatchSetCounterRequest {
    siteId: string;
    url: string;
    counters: Array<{
        key: string;
        increment: number;
    }>;
}

// 批量设置计数器响应接口
export interface BatchSetCounterResponse {
    code: number;
    message?: string;
    data?: Array<{
        key: string;
        num: number;
    }>;
}