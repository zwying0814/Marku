#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

/**
 * 开发服务器脚本
 * 监听源文件变化并自动重新构建
 */
class DevServer {
  constructor() {
    this.buildProcess = null;
    this.isBuilding = false;
    this.pendingBuild = false;
  }

  /**
   * 启动开发服务器
   */
  start() {
    console.log('🚀 Starting Marku development server...');
    
    // 初始构建
    this.build().then(() => {
      console.log('✅ Initial build completed');
      this.startWatcher();
    }).catch(error => {
      console.error('❌ Initial build failed:', error);
      process.exit(1);
    });
  }

  /**
   * 执行构建
   */
  build() {
    return new Promise((resolve, reject) => {
      if (this.isBuilding) {
        this.pendingBuild = true;
        return resolve();
      }

      this.isBuilding = true;
      console.log('🔨 Building...');

      const buildProcess = spawn('npm', ['run', 'build:dev'], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
      });

      buildProcess.on('close', (code) => {
        this.isBuilding = false;
        
        if (code === 0) {
          console.log('✅ Build completed successfully');
          resolve();
          
          // 如果有待处理的构建请求，执行它
          if (this.pendingBuild) {
            this.pendingBuild = false;
            setTimeout(() => this.build(), 100);
          }
        } else {
          console.error(`❌ Build failed with exit code ${code}`);
          reject(new Error(`Build failed with exit code ${code}`));
        }
      });

      buildProcess.on('error', (error) => {
        this.isBuilding = false;
        console.error('❌ Build process error:', error);
        reject(error);
      });
    });
  }

  /**
   * 启动文件监听器
   */
  startWatcher() {
    console.log('👀 Watching for file changes...');
    
    const watcher = chokidar.watch(['src/**/*', 'rollup.config.js', 'tsconfig.json'], {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: true
    });

    let debounceTimer = null;
    
    const handleChange = (path) => {
      console.log(`📝 File changed: ${path}`);
      
      // 防抖处理，避免频繁构建
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = setTimeout(() => {
        this.build().catch(error => {
          console.error('❌ Rebuild failed:', error);
        });
      }, 300);
    };

    watcher
      .on('change', handleChange)
      .on('add', handleChange)
      .on('unlink', handleChange)
      .on('error', error => console.error('❌ Watcher error:', error));

    // 优雅退出处理
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      watcher.close();
      if (this.buildProcess) {
        this.buildProcess.kill();
      }
      process.exit(0);
    });

    console.log('✅ Development server is running');
    console.log('   - Watching for changes in src/, rollup.config.js, tsconfig.json');
    console.log('   - Press Ctrl+C to stop');
  }
}

// 检查是否安装了必要的依赖
function checkDependencies() {
  const requiredDeps = ['chokidar'];
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);
  
  if (missingDeps.length > 0) {
    console.error('❌ Missing required dependencies:', missingDeps.join(', '));
    console.log('💡 Please install them with: npm install --save-dev', missingDeps.join(' '));
    process.exit(1);
  }
}

// 主程序
if (require.main === module) {
  checkDependencies();
  const devServer = new DevServer();
  devServer.start();
}

module.exports = DevServer;