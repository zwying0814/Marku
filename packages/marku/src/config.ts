import { CountConfig, ConfigOptions } from './types';

/**
 * 配置管理类
 */
export class Config {
    private static instance: Config;
    private config: CountConfig = {
        // 站点id，从后端获取
        siteId: '',
        // 后端接口地址
        apiBaseUrl: '',
        // 查询、提交是否包含url query参数
        includeQuery: true
    };

    /**
     * 获取单例实例
     */
    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    /**
     * 初始化配置
     * @param siteIdOrOptions - 站点ID或配置选项对象
     * @param apiBaseUrl - API基础URL（当第一个参数为字符串时使用）
     * @param includeQuery - 是否包含查询参数（当第一个参数为字符串时使用）
     */
    public init(siteIdOrOptions: string | ConfigOptions, apiBaseUrl?: string, includeQuery: boolean = true): void {
        if (typeof siteIdOrOptions === 'string') {
            // 传统方式：直接传入参数
            this.config = {
                siteId: siteIdOrOptions,
                apiBaseUrl: apiBaseUrl || '',
                includeQuery: includeQuery
            };
        } else {
            // 新方式：传入配置对象
            this.config = { ...this.config, ...siteIdOrOptions };
        }
    }

    /**
     * 获取配置
     */
    public getConfig(): CountConfig {
        return { ...this.config };
    }

    /**
     * 获取站点ID
     */
    public getSiteId(): string {
        return this.config.siteId;
    }

    /**
     * 获取API基础URL
     */
    public getApiBaseUrl(): string {
        return this.config.apiBaseUrl;
    }

    /**
     * 是否包含查询参数
     */
    public getIncludeQuery(): boolean {
        return this.config.includeQuery;
    }

    /**
     * 验证配置是否有效
     */
    public validate(): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!this.config.siteId) {
            errors.push('siteId is required');
        }

        if (!this.config.apiBaseUrl) {
            errors.push('apiBaseUrl is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// 导出默认实例
export const defaultConfig = Config.getInstance();

// 导出便捷函数
export const initConfig = (siteIdOrOptions?: string | ConfigOptions, apiBaseUrl?: string, includeQuery?: boolean) => {
    if (typeof siteIdOrOptions === 'string') {
        return defaultConfig.init(siteIdOrOptions, apiBaseUrl, includeQuery);
    } else {
        return defaultConfig.init(siteIdOrOptions || {});
    }
};
export const getConfig = () => defaultConfig.getConfig();
export const validateConfig = () => defaultConfig.validate();