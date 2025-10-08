import { fetchCountersBatch, setCountersBatch } from "./fetch";
import { findElementsWithAttribute, parseIncrement } from "./util";

export const processCounters = async () => {
    // 先执行 set 操作，再执行 get 操作以保证数据一致性
    await processSetCounter();
    await processGetCounter();
}

export const processGetCounter = async () => {
    // 查找所有带有marku-get-count属性的元素
    const counterElements = findElementsWithAttribute('marku-get-count');
    if (counterElements.length === 0) {
        console.log('Marku Counter: No elements with marku-get-count attribute found');
        return;
    }
    console.log(`Marku Counter: Found ${counterElements.length} counter elements`);
    // 收集所有key和对应的元素
    const keyElementMap = new Map<string, Element[]>();
    const keys: string[] = [];
    counterElements.forEach(element => {
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
    const countersData = await fetchCountersBatch(keys);
    // 更新所有元素
    keyElementMap.forEach((elements, key) => {
        const count = countersData.get(key);

        elements.forEach(element => {
            if (count !== null && count !== undefined) {
                element.textContent = count.toString();
                element.classList.remove('marku-loading');
                element.classList.add('marku-loaded');
            } else {
                // 请求失败，恢复原始文本
                element.classList.remove('marku-loading');
                element.classList.add('marku-error');
            }
        });
    });

    console.log('Marku Counter: All counters loaded');
}

export const processSetCounter = async () => {
    // 查找所有带有marku-set-count属性的元素
    const counterElements = findElementsWithAttribute('marku-set-count');
    if (counterElements.length === 0) {
        console.log('Marku Counter: No elements with marku-set-count attribute found');
        return;
    }
    console.log(`Marku Counter: Found ${counterElements.length} counter elements`);
    // 收集所有计数器数据
    const counters: Array<{ mark: string; increment: number }> = [];
    counterElements.forEach(element => {
        const mark = element.getAttribute('marku-set-count');
        if (!mark) {
            console.warn('Marku Counter: Element has empty marku-set-count attribute', element);
            return;
        }

        // 解析自增量
        const increment = parseIncrement(element);
        counters.push({ mark, increment });

        // 设置处理状态
        element.classList.add('marku-processing');
    });
    // 批量提交到后端
    const success = await setCountersBatch(counters);
    // 更新元素状态
    counterElements.forEach(element => {
        element.classList.remove('marku-processing');
        if (success) {
            element.classList.add('marku-submitted');
        } else {
            element.classList.add('marku-submit-error');
        }
    });

    console.log('Marku Counter: All set-counters processed');
}