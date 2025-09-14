/**
 * Marku Library
 * A TypeScript library built with Rollup
 */

// 导出主要功能
import MarkuCounter, { 
  init, 
  defaultCounter 
} from './count';

// 导出类型定义
export type { CountConfig, BatchAPIResponse, CounterEventDetail } from './types';

// 导出常量
export const VERSION = '1.0.0';
export const LIBRARY_NAME = 'Marku';

// 导出便捷函数
export { 
  MarkuCounter,
  init, 
  defaultCounter 
};

// 默认导出
export default {
  VERSION,
  LIBRARY_NAME,
  MarkuCounter,
  init,
  defaultCounter
};