import { FindUtils } from './find';
import { ConfigOptions, CounterEventDetail } from './types';
import { Utils } from './utils';
import { FetchUtils } from './fetch';
import { defaultConfig } from './config';
// 计数器类
export default class MarkuCounter {

    /**
     * 初始化计数器
     * @param siteIdOrOptions - 站点ID或配置选项对象
     * @param apiBaseUrl - API基础URL（当第一个参数为字符串时使用）
     * @param includeQuery - 是否包含查询参数（当第一个参数为字符串时使用）
     */
    public init(siteIdOrOptions: string | ConfigOptions, apiBaseUrl?: string, includeQuery: boolean = true): void {

        defaultConfig.init(siteIdOrOptions, apiBaseUrl, includeQuery);

        this.loadCounters();
        this.processSetCounters();

    }

    /**
     * 加载所有计数器
     */
    public async loadCounters(): Promise<void> {
        // 查找页面中所有计数元素
        const elements = FindUtils.findCounterElements();

        if (elements.length === 0) {
            console.log('Marku Counter: No elements with marku-get-count attribute found');
            return;
        }
        console.log(`Marku Counter: Found ${elements.length} counter elements`);

        // 收集所有key和对应的元素
        const keyElementMap = new Map<string, Element[]>();
        const keys: string[] = [];

        Array.from(elements).forEach(element => {
            const key = element.getAttribute('marku-get-count');
            if (!key) {
                console.warn('Marku Counter: Element has empty marku-get-count attribute', element);
                return;
            }

            if (!keyElementMap.has(key)) {
                keyElementMap.set(key, []);
                keys.push(key);
            }
            keyElementMap.get(key)!.push(element);

            // 设置加载状态
            element.classList.add('marku-loading');
        });

        // 批量请求所有计数器
        const countersData = await FetchUtils.fetchCountersBatch(keys);

        // 更新所有元素
        keyElementMap.forEach((elements, key) => {
            const count = countersData.get(key);

            elements.forEach(element => {
                if (count !== null && count !== undefined) {
                    element.textContent = count.toString();
                    element.classList.remove('marku-loading');
                    element.classList.add('marku-loaded');

                    // 触发自定义事件
                    if (typeof CustomEvent !== 'undefined') {
                        const event = new CustomEvent<CounterEventDetail>('marku:counter-loaded', {
                            detail: { key, count }
                        });
                        element.dispatchEvent(event);
                    }
                } else {
                    // 请求失败，恢复原始文本
                    element.classList.remove('marku-loading');
                    element.classList.add('marku-error');

                    // 触发错误事件
                    if (typeof CustomEvent !== 'undefined') {
                        const event = new CustomEvent<CounterEventDetail>('marku:counter-error', {
                            detail: { key }
                        });
                        element.dispatchEvent(event);
                    }
                }
            });
        });

        console.log('Marku Counter: All counters loaded');
    }


    /**
     * 处理页面中的所有marku-set-count元素
     * 收集它们的key和自增量，批量提交到后端
     */
    public async processSetCounters(): Promise<void> {
        // 查找页面中所有设置计数元素
        const allElements = FindUtils.findSetCounterElements();

        // 过滤掉已经处理过的元素
        const elements = Array.from(allElements).filter(element =>
            !element.classList.contains('marku-submitted') &&
            !element.classList.contains('marku-processing')
        );

        if (elements.length === 0) {
            console.log('Marku Counter: No new elements with marku-set-count attribute found');
            return;
        }

        console.log(`Marku Counter: Found ${elements.length} new set-counter elements`);

        // 收集所有计数器数据
        const counters: Array<{ key: string; increment: number }> = [];

        elements.forEach(element => {
            const key = element.getAttribute('marku-set-count');
            if (!key) {
                console.warn('Marku Counter: Element has empty marku-set-count attribute', element);
                return;
            }

            // 解析自增量
            const increment = Utils.parseIncrement(element);
            counters.push({ key, increment });

            // 设置处理状态
            element.classList.add('marku-processing');
        });

        // 批量提交到后端
        const success = await this.submitCountersBatch(counters);

        // 更新元素状态
        elements.forEach(element => {
            element.classList.remove('marku-processing');
            if (success) {
                element.classList.add('marku-submitted');

                // 触发自定义事件
                if (typeof CustomEvent !== 'undefined') {
                    const key = element.getAttribute('marku-set-count');
                    const increment = Utils.parseIncrement(element);
                    const event = new CustomEvent('marku:counter-submitted', {
                        detail: { key, increment }
                    });
                    element.dispatchEvent(event);
                }
            } else {
                element.classList.add('marku-submit-error');

                // 触发错误事件
                if (typeof CustomEvent !== 'undefined') {
                    const key = element.getAttribute('marku-set-count');
                    const event = new CustomEvent('marku:counter-submit-error', {
                        detail: { key }
                    });
                    element.dispatchEvent(event);
                }
            }
        });

        console.log('Marku Counter: All set-counters processed');
    }

    /**
     * 批量提交计数器数据到后端
     * @param counters - 计数器数据数组
     * @returns 是否提交成功
     */
    private async submitCountersBatch(counters: Array<{ key: string; increment: number }>): Promise<boolean> {
        return await FetchUtils.submitCountersBatch(counters);
    }


}

// 创建默认实例
export const defaultCounter = new MarkuCounter();

// 便捷函数
export const init = (siteIdOrOptions: string | ConfigOptions, apiBaseUrl?: string, includeQuery: boolean = true) => defaultCounter.init(siteIdOrOptions, apiBaseUrl, includeQuery);