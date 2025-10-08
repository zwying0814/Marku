# Marku 发布指南

## 发布前准备

### 1. 更新版本号
```bash
# 更新 package.json 中的版本号
npm version patch   # 补丁版本 (2.0.0 -> 2.0.1)
npm version minor   # 次要版本 (2.0.0 -> 2.1.0)
npm version major   # 主要版本 (2.0.0 -> 3.0.0)
```

### 2. 更新作者信息
编辑 `package.json` 中的 `author` 字段：
```json
{
  "author": "Your Name <your.email@example.com>"
}
```

### 3. 检查依赖
确保所有依赖都是最新的稳定版本。

## 发布流程

### 1. 验证构建
```bash
# 清理并重新构建
pnpm clean
pnpm build:lib

# 验证构建结果
pnpm validate
```

### 2. 测试发布（Dry Run）
```bash
# 模拟发布过程，不会真正发布
pnpm publish:dry
```

### 3. 正式发布
```bash
# 发布到 npm
pnpm publish:npm
```

## 自动化流程

项目配置了 `prepublishOnly` 钩子，会在发布前自动执行：
1. 清理 dist 目录
2. 类型检查
3. 构建库文件
4. 验证构建结果

## 发布后验证

### 1. 检查 npm 包
```bash
# 查看包信息
npm view marku

# 安装测试
npm install marku
```

### 2. 测试安装
在新项目中测试安装和使用：
```javascript
import Marku from 'marku';

const marku = new Marku({
  apiUrl: 'https://your-api.com'
});
```

## 故障排除

### 常见问题

1. **类型文件缺失**
   - 确保 `tsconfig.build.json` 配置正确
   - 检查构建顺序：先构建 JS，再生成类型文件

2. **发布权限问题**
   ```bash
   npm login
   npm whoami
   ```

3. **包名冲突**
   - 检查 npm 上是否已存在同名包
   - 考虑使用 scoped package: `@yourname/marku`

### 版本管理

- 遵循 [语义化版本](https://semver.org/lang/zh-CN/)
- 主要版本：不兼容的 API 修改
- 次要版本：向下兼容的功能性新增
- 修订版本：向下兼容的问题修正

## 文件结构

发布包包含以下文件：
```
dist/
├── marku.es.js      # ES 模块版本
├── marku.umd.js     # UMD 版本
├── marku.d.ts       # 主类型声明
├── *.d.ts           # 其他类型声明文件
└── *.d.ts.map       # 类型映射文件
```

## 配置说明

### package.json 关键字段
- `main`: UMD 版本入口
- `module`: ES 模块入口  
- `types`: TypeScript 类型声明
- `exports`: 现代模块解析
- `files`: 发布包含的文件
- `publishConfig`: 发布配置