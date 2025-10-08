// 模块配置接口
export interface MarkuConfig {
    siteId: string;
    apiBaseUrl: string;
}

const config: MarkuConfig = {
    siteId: '',
    apiBaseUrl: ''
}

// 初始化配置
export function initConfig(options: MarkuConfig): void {
    config.siteId = options.siteId;
    config.apiBaseUrl = options.apiBaseUrl;
}


export default config;