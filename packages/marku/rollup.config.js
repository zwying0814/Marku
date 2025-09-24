import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

// 读取 package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// 基础配置
const baseConfig = {
  input: 'src/index.ts',
  // 移除外部依赖，将所有依赖打包进 UMD 文件
  external: [],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
      // 解析所有依赖到 bundle 中
      exportConditions: ['browser']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      rootDir: './src'
    })
  ]
};

// UMD 开发版本配置
const umdDevConfig = {
  ...baseConfig,
  output: {
    file: 'dist/index.umd.js',
    format: 'umd',
    name: 'Marku',
    sourcemap: true,
    // 浏览器全局变量名
    globals: {}
  }
};

// UMD 压缩版本配置
const umdProdConfig = {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn']
      },
      format: {
        comments: false
      },
      mangle: {
        reserved: ['Marku']
      }
    })
  ],
  output: {
    file: 'dist/index.umd.min.js',
    format: 'umd',
    name: 'Marku',
    sourcemap: true,
    globals: {}
  }
};

// 始终生成两个版本：开发版和压缩版
export default [umdDevConfig, umdProdConfig];