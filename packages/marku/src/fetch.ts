import { BatchAPIResponse, BatchSetCounterRequest, BatchSetCounterResponse } from './types';
import { defaultConfig } from './config';

/**
 * 网络请求工具类
 */
export class FetchUtils {
    
    /**
     * 批量获取计数器数据
     * @param keys - 计数器键值数组
     * @returns 计数器数据映射
     */
    public static async fetchCountersBatch(keys: string[]): Promise<Map<string, number | null>> {
        const result = new Map<string, number | null>();

        if (keys.length === 0) {
            return result;
        }

        const config = defaultConfig.getConfig();

        // 验证配置
        if (!config.apiBaseUrl) {
            console.error('Marku Counter: apiBaseUrl is required for fetchCountersBatch');
            keys.forEach(key => {
                result.set(key, null);
            });
            return result;
        }

        try {
            const url = new URL('/api/count/batch', config.apiBaseUrl);

            const requestBody = {
                siteId: config.siteId,
                keys: keys
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

            const data: BatchAPIResponse = await response.json();

            console.log('Marku Counter: Batch API response', data);

            // 检查API响应格式
            if (data.code === 200 && data.data) {
                // 将响应数据转换为Map
                data.data.forEach(item => {
                    result.set(item.key, item.num || 0);
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

    /**
     * 批量提交计数器数据到后端
     * @param counters - 计数器数据数组
     * @returns 是否提交成功
     */
    public static async submitCountersBatch(counters: Array<{ key: string; increment: number }>): Promise<boolean> {
        if (counters.length === 0) {
            return true;
        }

        const config = defaultConfig.getConfig();

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
}
