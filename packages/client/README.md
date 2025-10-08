# Marku

A lightweight JavaScript library for website analytics, including page view counters and comment systems.

## Features

- 📊 **Page View Counters**: Track and display page view statistics
- 💬 **Comment System**: Collect and manage user comments
- 🚀 **Lightweight**: Minimal footprint with no external dependencies
- 📱 **Modern**: Built with TypeScript and ES modules
- 🔧 **Easy Integration**: Simple API for quick setup

## Installation

```bash
npm install marku
```

## Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Page view counter -->
    <p>Views: <span marku-get-count="page-view">0</span></p>
    <button marku-set-count="page-view" marku-inc="1">+1</button>

    <!-- Comment form -->
    <form marku-comment-form="article-1">
        <input type="text" marku-comment-username placeholder="Name" required>
        <input type="email" marku-comment-email placeholder="Email" required>
        <textarea marku-comment-content placeholder="Comment" required></textarea>
        <button type="button" marku-comment-submit>Submit</button>
    </form>

    <script src="https://unpkg.com/marku@latest/dist/marku.umd.js"></script>
    <script>
        const marku = new Marku({
            siteId: 'your-site-id',
            apiBaseUrl: 'https://your-api-server.com'
        });
        marku.init();
    </script>
</body>
</html>
```

### ES Modules

```javascript
import Marku from 'marku';

const marku = new Marku({
    siteId: 'your-site-id',
    apiBaseUrl: 'https://your-api-server.com'
});

marku.init();

// Listen for events
document.addEventListener('marku:comment-success', (e) => {
    console.log('Comment submitted:', e.detail);
});

document.addEventListener('marku:comment-error', (e) => {
    console.error('Comment failed:', e.detail);
});
```

## Configuration

```javascript
const config = {
    siteId: 'your-site-id',        // Required: Unique identifier for your site
    apiBaseUrl: 'https://api.com', // Required: Your API server URL
    debug: false                   // Optional: Enable debug logging
};

const marku = new Marku(config);
```

## API Reference

### Constructor

```javascript
new Marku(config)
```

### Methods

- `init(config?)`: Initialize Marku with optional config override
- `reload()`: Reload and reprocess all elements
- `isInitialized()`: Check if Marku is initialized

### HTML Attributes

#### Counter Attributes
- `marku-get-count="key"`: Display counter value
- `marku-set-count="key"`: Set counter (use with marku-inc)
- `marku-inc="number"`: Increment amount for set counter

#### Comment Attributes
- `marku-comment-form="article-id"`: Comment form container
- `marku-comment-username`: Username input field
- `marku-comment-email`: Email input field
- `marku-comment-url`: Website URL input field (optional)
- `marku-comment-content`: Comment content textarea
- `marku-comment-submit`: Submit button

### Events

- `marku:comment-success`: Fired when comment is successfully submitted
- `marku:comment-error`: Fired when comment submission fails

## TypeScript Support

Marku is written in TypeScript and includes full type definitions:

```typescript
import Marku, { MarkuConfig, CommentData } from 'marku';

const config: MarkuConfig = {
    siteId: 'my-site',
    apiBaseUrl: 'https://api.example.com'
};

const marku = new Marku(config);
```

## Browser Support

- Chrome 63+
- Firefox 67+
- Safari 13.1+
- Edge 79+

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues, please [open an issue](https://github.com/yourusername/marku/issues) on GitHub.