export class Utils {
    /**
     * 获取当前页面URL（不包含域名）
     * @returns 页面路径
     */
    public static getCurrentPageUrl(includeQuery:boolean): string {
        if (typeof window === 'undefined') {
            return '/';
        }
        
        return includeQuery 
            ? window.location.pathname + window.location.search
            : window.location.pathname;
    }

    /**
     * 解析元素的marku-inc-[数字]属性，获取自增量
     * @param element - DOM元素
     * @returns 自增量，默认为1
     */
    public static parseIncrement(element: Element): number {
        // 获取所有属性名
        const attributes = element.getAttributeNames();
        
        // 查找marku-inc-[数字]格式的属性
        for (const attrName of attributes) {
            const match = attrName.match(/^marku-inc-\[(-?\d+)\]$/);
            if (match) {
                const increment = parseInt(match[1] ?? '0', 10);
                return isNaN(increment) ? 1 : increment;
            }
        }
        
        // 默认自增量为1
        return 1;
    }
}
