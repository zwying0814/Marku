// 解析元素的marku-inc属性，获取自增量
export const parseIncrement = (element: Element): number => {
    const incAttr = element.getAttribute('marku-inc');
    if (incAttr !== null) {
        const increment = parseInt(incAttr, 10);
        return isNaN(increment) ? 1 : increment;
    }
    // 默认自增量为1
    return 1;
}

// 查找具有某个属性的所有元素
export const findElementsWithAttribute = (attributeName: string): NodeListOf<Element> | Element[] => {
    if (typeof document === 'undefined') {
        return [];
    }
    return document.querySelectorAll(`[${attributeName}]`);
}

// 获取浏览器UA
export const getBrowserUA = (): string => {
    if (typeof navigator === 'undefined') {
        return '';
    }
    return navigator.userAgent;
}

// 获取用户IP信息
export interface IPInfo {
    ret: string;
    data: {
        ip: string;
        location: string[];
    };
}
export const getUserIPInfo = async (): Promise<IPInfo> => {
    try {
        const response = await fetch('https://myip.ipip.net/json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Marku Comment: Failed to fetch user IP:', error);
        return {
            ret: 'error',
            data: {
                ip: '',
                location: []
            }
        };
    }
}