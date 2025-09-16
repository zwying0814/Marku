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
  external: [
    // 将 peerDependencies 和 dependencies 标记为外部依赖
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.dependencies || {})
  ],
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
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

// 开发环境配置
const devConfig = {
  ...baseConfig,
  output: {
    file: pkg.browser,
    format: 'umd',
    name: 'Marku',
    sourcemap: true,
    globals: {
      // 如果有外部依赖，在这里定义全局变量名
    }
  }
};

// 生产环境配置
const prodConfig = {
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    })
  ],
  output: {
    file: pkg.browser.replace('.js', '.min.js'),
    format: 'umd',
    name: 'Marku',
    sourcemap: true,
    globals: {
      // 如果有外部依赖，在这里定义全局变量名
    }
  }
};

// 根据环境变量决定使用哪个配置
export default process.env.NODE_ENV === 'production' 
  ? [devConfig, prodConfig] 
  : devConfig;