import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    // 库构建模式
    return {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/marku.ts'),
          name: 'Marku',
          fileName: (format) => `marku.${format}.js`,
          formats: ['es', 'umd']
        },
        rollupOptions: {
          output: {
            globals: {
              // 如果有外部依赖，在这里定义
            }
          }
        }
      }
    }
  }

  // 开发模式
  return {
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist'
    }
  }
})