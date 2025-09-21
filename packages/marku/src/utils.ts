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
     * 解析元素的marku-inc属性，获取自增量
     * @param element - DOM元素
     * @returns 自增量，默认为1
     */
    public static parseIncrement(element: Element): number {
        // 优先使用新的标准属性格式 marku-inc="数字"
        const incAttr = element.getAttribute('marku-inc');
        if (incAttr !== null) {
            const increment = parseInt(incAttr, 10);
            return isNaN(increment) ? 1 : increment;
        }
        
        // 默认自增量为1
        return 1;
    }
}
