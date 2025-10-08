import { processCommentSubmit } from "./comment";
import { initConfig, type MarkuConfig } from "./config";
import { processCounters } from "./counter";

// Marku类，支持实例化调用
class Marku {
    private config: MarkuConfig | null = null;
    private initialized: boolean = false;

    constructor(config?: MarkuConfig) {
        if (config) {
            this.config = config;
        }
        // 构造函数中不自动初始化，等待显式调用init()
    }

    // 初始化方法 - 支持传入配置或使用构造函数中的配置
    init(config?: MarkuConfig): void {
        if (this.initialized) {
            console.warn('Marku: Already initialized');
            return;
        }

        // 如果传入了配置，使用传入的配置；否则使用构造函数中的配置
        if (config) {
            this.config = config;
        }

        if (!this.config) {
            throw new Error('Marku: Configuration is required. Please provide config in constructor or init() method.');
        }
        
        // 初始化配置
        initConfig(this.config);
        this.initialized = true;
        
        // 处理计数器
        this.processCounters();
        // 处理评论
        this.processComment();
    }

    // 重新加载/刷新计数器
    reload(): void {
        if (!this.initialized) {
            console.warn('Marku: Not initialized yet. Call init() first.');
            return;
        }
        
        // 重新处理计数器
        this.processCounters();
    }

    // 私有方法：处理计数器
    private processCounters(): void {
        processCounters();
    }

    // 私有方法：处理评论
    private processComment(): void {
        // 处理评论提交
        processCommentSubmit();
        // 处理评论列表
        // processCommentList();
    }

    // 检查是否已初始化
    isInitialized(): boolean {
        return this.initialized;
    }
}

export default Marku;

// 导出配置接口供外部使用
export type { MarkuConfig } from "./config";

// 导出其他有用的接口
export type { CommentData, CommentSubmitResponse } from "./fetch";
export type { IPInfo } from "./util";