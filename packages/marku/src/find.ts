export class FindUtils {
    /**
     * 查找所有带有marku-get-count属性的元素
     * @returns 元素列表
    */
    public static findCounterElements(): NodeListOf<Element> | Element[] {
        if (typeof document === 'undefined') {
            return [];
        }
        return document.querySelectorAll('[marku-get-count]');
    }

    /**
     * 查找所有带有marku-set-count属性的元素
     * @returns 元素列表
     */
    public static findSetCounterElements(): NodeListOf<Element> | Element[] {
        if (typeof document === 'undefined') {
            return [];
        }
        return document.querySelectorAll('[marku-set-count]');
    }
}