# Marku

一个轻量级、灵活的静态网页扩展库。

## 特性

- 🚀 轻量级 UMD 包，仅 ~5KB (压缩后)
- 🌐 专为浏览器设计，支持所有现代浏览器
- 📦 支持 CDN 直接引入
- 🔄 支持 pjax 等 SPA 场景的重载功能
- 📊 支持批量计数操作
- 🎯 简单易用的 API

## 安装

### CDN 引入 (推荐)

```html
<!-- 开发版本 -->
<script src="https://unpkg.com/marku@latest/dist/index.umd.js"></script>

<!-- 压缩版本 -->
<script src="https://unpkg.com/marku@latest/dist/index.umd.min.js"></script>

<!-- 或使用 jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/marku@latest/dist/index.umd.min.js"></script>
```

### npm 安装

```bash
npm install marku
```

## 使用方法

### 基础使用

```html
<!DOCTYPE html>
<html>
<head>
    <title>Marku 示例</title>
</head>
<body>
    <!-- 显示计数 -->
    <span marku-get-count="page-views">0</span>
    
    <!-- 增加计数 -->
    <button marku-set-count="page-views" marku-increment="1">点击计数</button>

    <script src="https://unpkg.com/marku@latest/dist/index.umd.min.js"></script>
    <script>
        // 初始化
        Marku.init('your-site-id', 'https://your-api-endpoint.com');
    </script>
</body>
</html>
```

### 高级配置

```javascript
// 使用配置对象初始化
Marku.init({
    siteId: 'your-site-id',
    apiBaseUrl: 'https://your-api-endpoint.com',
    includeQuery: false,
    timeout: 5000
});
```

### pjax 支持

```javascript
// 在 pjax 页面切换后调用
Marku.reload();
```

## API 参考

### 初始化

```javascript
Marku.init(siteIdOrOptions, apiBaseUrl?, includeQuery?)
```

### 重载

```javascript
Marku.reload()
```

适用于 pjax、SPA 路由切换等场景。

### HTML 属性

- `marku-get-count="key"`: 显示指定 key 的计数值
- `marku-set-count="key"`: 为指定 key 增加计数
- `marku-increment="number"`: 指定增加的数量（默认为 1）

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！