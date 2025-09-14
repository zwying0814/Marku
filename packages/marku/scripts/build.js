#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * 生产构建脚本
 * 清理输出目录、执行构建、生成构建报告
 */
class BuildScript {
  constructor() {
    this.distDir = path.join(process.cwd(), 'dist');
    this.startTime = Date.now();
  }

  /**
   * 执行完整构建流程
   */
  async build() {
    try {
      console.log('🚀 Starting production build...');
      console.log('📁 Project:', path.basename(process.cwd()));
      console.log('⏰ Started at:', new Date().toLocaleString());
      console.log('');

      // 1. 清理输出目录
      await this.clean();

      // 2. 执行类型检查
      await this.typeCheck();

      // 3. 执行构建
      await this.runBuild();

      // 4. 生成构建报告
      await this.generateReport();

      console.log('');
      console.log('✅ Build completed successfully!');
      console.log(`⏱️  Total time: ${this.getElapsedTime()}`);
      
    } catch (error) {
      console.error('');
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * 清理输出目录
   */
  async clean() {
    console.log('🧹 Cleaning output directory...');
    
    if (fs.existsSync(this.distDir)) {
      await this.removeDirectory(this.distDir);
    }
    
    fs.mkdirSync(this.distDir, { recursive: true });
    console.log('   ✓ Output directory cleaned');
  }

  /**
   * 执行TypeScript类型检查
   */
  async typeCheck() {
    console.log('🔍 Running TypeScript type check...');
    
    return new Promise((resolve, reject) => {
      const tscProcess = spawn('npx', ['tsc', '--noEmit'], {
        stdio: 'pipe',
        shell: true,
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      tscProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      tscProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tscProcess.on('close', (code) => {
        if (code === 0) {
          console.log('   ✓ Type check passed');
          resolve();
        } else {
          console.error('   ❌ Type check failed');
          if (errorOutput) console.error(errorOutput);
          if (output) console.error(output);
          reject(new Error('TypeScript type check failed'));
        }
      });

      tscProcess.on('error', (error) => {
        console.error('   ❌ Type check process error:', error);
        reject(error);
      });
    });
  }

  /**
   * 执行Rollup构建
   */
  async runBuild() {
    console.log('🔨 Running Rollup build...');
    
    return new Promise((resolve, reject) => {
      const rollupProcess = spawn('npx', ['rollup', '-c', '--environment', 'NODE_ENV:production'], {
        stdio: 'pipe',
        shell: true,
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      rollupProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        // 实时显示构建进度
        if (text.includes('created') || text.includes('→')) {
          console.log('   ' + text.trim());
        }
      });

      rollupProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      rollupProcess.on('close', (code) => {
        if (code === 0) {
          console.log('   ✓ Rollup build completed');
          resolve();
        } else {
          console.error('   ❌ Rollup build failed');
          if (errorOutput) console.error(errorOutput);
          if (output) console.error(output);
          reject(new Error('Rollup build failed'));
        }
      });

      rollupProcess.on('error', (error) => {
        console.error('   ❌ Rollup process error:', error);
        reject(error);
      });
    });
  }

  /**
   * 生成构建报告
   */
  async generateReport() {
    console.log('📊 Generating build report...');
    
    try {
      const files = await this.getDistFiles();
      const report = {
        buildTime: new Date().toISOString(),
        duration: this.getElapsedTime(),
        files: files,
        totalSize: files.reduce((sum, file) => sum + file.size, 0)
      };

      // 显示文件列表
      console.log('');
      console.log('📦 Generated files:');
      files.forEach(file => {
        const sizeStr = this.formatFileSize(file.size);
        console.log(`   ${file.name.padEnd(30)} ${sizeStr.padStart(10)}`);
      });
      
      console.log('   ' + '-'.repeat(42));
      console.log(`   ${'Total'.padEnd(30)} ${this.formatFileSize(report.totalSize).padStart(10)}`);

      // 保存报告到文件
      const reportPath = path.join(this.distDir, 'build-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log('');
      console.log(`📄 Build report saved to: ${path.relative(process.cwd(), reportPath)}`);
      
    } catch (error) {
      console.warn('⚠️  Failed to generate build report:', error.message);
    }
  }

  /**
   * 获取dist目录下的所有文件
   */
  async getDistFiles() {
    const files = [];
    
    async function scanDirectory(dir, basePath = '') {
      const items = await readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          await scanDirectory(fullPath, relativePath);
        } else {
          files.push({
            name: relativePath.replace(/\\/g, '/'),
            size: stats.size,
            path: fullPath
          });
        }
      }
    }
    
    if (fs.existsSync(this.distDir)) {
      await scanDirectory(this.distDir);
    }
    
    return files.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * 递归删除目录
   */
  async removeDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = await readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        await this.removeDirectory(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }
    
    fs.rmdirSync(dir);
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * 获取已用时间
   */
  getElapsedTime() {
    const elapsed = Date.now() - this.startTime;
    const seconds = (elapsed / 1000).toFixed(1);
    return `${seconds}s`;
  }
}

// 主程序
if (require.main === module) {
  const buildScript = new BuildScript();
  buildScript.build();
}

module.exports = BuildScript;