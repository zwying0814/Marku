#!/usr/bin/env node

/**
 * Marku 自动化发布脚本
 * 
 * 功能：
 * 1. 切换到官方 npm 源
 * 2. 执行 marku 包的发布
 * 3. 恢复淘宝源
 * 4. 提供详细的状态提示和错误处理
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 日志工具
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}→${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}\n`)
};

// 配置
const config = {
  markuPath: path.join(__dirname, '../packages/marku'),
  npmRegistry: 'https://registry.npmjs.org',
  taobaoRegistry: 'https://registry.npmmirror.com/',
  packageName: 'marku'
};

// 执行命令的工具函数
function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

// 获取当前 npm 源
function getCurrentRegistry() {
  const result = execCommand('npm config get registry', { silent: true });
  if (result.success) {
    return result.output.trim();
  }
  return null;
}

// 设置 npm 源
function setRegistry(registry) {
  log.step(`切换 npm 源到: ${registry}`);
  const result = execCommand(`npm config set registry ${registry}`);
  if (result.success) {
    log.success(`npm 源已切换到: ${registry}`);
    return true;
  } else {
    log.error(`切换 npm 源失败: ${result.error}`);
    return false;
  }
}

// 检查是否已登录 npm
function checkNpmLogin() {
  log.step('检查 npm 登录状态...');
  const result = execCommand('npm whoami', { silent: true });
  if (result.success) {
    const username = result.output.trim();
    log.success(`已登录 npm，用户名: ${username}`);
    return true;
  } else {
    log.warning('未登录 npm 或登录已过期');
    return false;
  }
}

// 检查 marku 包是否存在
function checkMarkuPackage() {
  if (!fs.existsSync(config.markuPath)) {
    log.error(`marku 包路径不存在: ${config.markuPath}`);
    return false;
  }
  
  const packageJsonPath = path.join(config.markuPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log.error(`package.json 不存在: ${packageJsonPath}`);
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    log.info(`准备发布 ${packageJson.name}@${packageJson.version}`);
    return true;
  } catch (error) {
    log.error(`读取 package.json 失败: ${error.message}`);
    return false;
  }
}

// 构建 marku 包
function buildMarku() {
  log.step('构建 marku 包...');
  
  // 切换到 marku 目录
  process.chdir(config.markuPath);
  
  // 清理并构建
  const cleanResult = execCommand('pnpm clean');
  if (!cleanResult.success) {
    log.error(`清理失败: ${cleanResult.error}`);
    return false;
  }
  
  const buildResult = execCommand('pnpm build');
  if (!buildResult.success) {
    log.error(`构建失败: ${buildResult.error}`);
    return false;
  }
  
  log.success('marku 包构建完成');
  return true;
}

// 发布 marku 包
function publishMarku() {
  log.step('发布 marku 包到 npm...');
  
  // 确保在 marku 目录
  process.chdir(config.markuPath);
  
  // 执行发布
  const result = execCommand('npm publish --access public');
  if (result.success) {
    log.success('marku 包发布成功！');
    return true;
  } else {
    log.error(`发布失败: ${result.error}`);
    return false;
  }
}

// 主函数
async function main() {
  log.title('🚀 Marku 自动化发布脚本');
  
  // 记录原始 npm 源
  const originalRegistry = getCurrentRegistry();
  log.info(`当前 npm 源: ${originalRegistry}`);
  
  try {
    // 1. 检查 marku 包
    if (!checkMarkuPackage()) {
      process.exit(1);
    }
    
    // 2. 切换到官方 npm 源
    if (!setRegistry(config.npmRegistry)) {
      process.exit(1);
    }
    
    // 3. 检查 npm 登录状态
    if (!checkNpmLogin()) {
      log.warning('请先登录 npm: npm login');
      log.info('登录后重新运行此脚本');
      return;
    }
    
    // 4. 构建包
    if (!buildMarku()) {
      process.exit(1);
    }
    
    // 5. 发布包
    if (!publishMarku()) {
      process.exit(1);
    }
    
    log.title('🎉 发布完成！');
    
    // 显示包信息
    log.info('你可以通过以下方式使用 marku:');
    console.log(`
${colors.cyan}CDN 引入:${colors.reset}
<script src="https://unpkg.com/marku@latest/dist/index.umd.min.js"></script>

${colors.cyan}npm 安装:${colors.reset}
npm install marku

${colors.cyan}验证发布:${colors.reset}
npm view marku
    `);
    
  } catch (error) {
    log.error(`发布过程中出现错误: ${error.message}`);
    process.exit(1);
  } finally {
    // 恢复原始 npm 源
    if (originalRegistry && originalRegistry !== config.npmRegistry) {
      log.step('恢复原始 npm 源...');
      if (setRegistry(originalRegistry)) {
        log.success(`已恢复到原始 npm 源: ${originalRegistry}`);
      }
    } else {
      // 如果原始源就是官方源，则切换到淘宝源
      log.step('切换到淘宝源...');
      if (setRegistry(config.taobaoRegistry)) {
        log.success(`已切换到淘宝源: ${config.taobaoRegistry}`);
      }
    }
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  log.error(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`未处理的 Promise 拒绝: ${reason}`);
  process.exit(1);
});

// 处理 Ctrl+C 中断
process.on('SIGINT', () => {
  log.warning('\n发布过程被中断');
  
  // 尝试恢复 npm 源
  const originalRegistry = getCurrentRegistry();
  if (originalRegistry !== config.taobaoRegistry) {
    log.step('恢复 npm 源...');
    setRegistry(config.taobaoRegistry);
  }
  
  process.exit(0);
});

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };