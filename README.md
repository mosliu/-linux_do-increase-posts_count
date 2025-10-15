# Linux.do 自动浏览脚本

自动浏览 linux.do 论坛帖子的脚本，支持浏览器控制台运行和 Playwright 无头浏览器运行。

## 文件说明

- **linux-auto-view.js** - 原始版本（浏览器控制台）
- **linux-auto-view-v2.js** - 优化版本（浏览器控制台）
- **linux-auto-view-playwright.js** - Playwright 无头浏览器版本（推荐）

## Playwright 版本使用方法

### 1. 安装依赖

```bash
npm install
```

### 2. 安装浏览器

```bash
npm run install-browser
```

或者手动安装：

```bash
npx playwright install chromium
```

### 3. 导出 Cookies（推荐，用于无头模式）

**方式一：直接复制 Cookie 字符串（最简单）**

1. 打开浏览器访问 https://linux.do 并登录
2. 按 F12 打开开发者工具
3. 切换到 **Network (网络)** 标签
4. 刷新页面 (F5)
5. 点击第一个请求（通常是 `linux.do`）
6. 在右侧找到 **Request Headers (请求头)**
7. 找到 `Cookie:` 这一行，复制完整的 Cookie 字符串
8. 在项目根目录创建 `cookies.txt` 文件，粘贴保存
9. 运行脚本时会自动转换为 `cookies.json`

**方式二：使用浏览器控制台导出**

1. 打开浏览器访问 https://linux.do 并登录
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. 复制 `export-cookies.js` 的全部内容并粘贴到控制台运行
5. 使用 `convertCookieString("你的Cookie字符串")` 转换

主要需要的 Cookie：
- `_t` - 用户认证 token
- `_forum_session` - 会话 ID
- `cf_clearance` - Cloudflare 验证

### 4. 运行脚本

```bash
npm start
```

或者：

```bash
node linux-auto-view-playwright.js
```

## 配置参数

在 `linux-auto-view-playwright.js` 文件顶部可以修改配置：

```javascript
const CONFIG = {
    maxTopicsLength: 200,           // 获取话题数量
    loginUrl: 'https://linux.do',   // 登录页面URL
    headless: false,                // 是否无头模式（false可以看到浏览器运行）
    scrollDelay: 500,               // 滚动延迟（毫秒）
    readDelay: 2000,                // 阅读延迟（毫秒）
    enterTopicDelay: 5000,          // 进入话题延迟（毫秒）
    cookiesFile: 'cookies.json',    // Cookies 文件路径
    useCookies: true,               // 是否使用 Cookies 登录
    timeout: 120000,                // 页面加载超时时间（毫秒，默认 2 分钟）
    proxy: null,                    // 代理设置，格式：{ server: 'http://proxy.example.com:8080', username: 'user', password: 'pass' }
};
```

**重要说明：**
- 如果设置 `useCookies: true`，脚本会自动加载 `cookies.json` 文件
- 如果设置 `headless: true`（无头模式），**必须**使用 Cookies 登录
- 如果 Cookies 加载失败或过期，脚本会自动切换到手动登录模式
- 代理配置示例：
  - HTTP 代理：`{ server: 'http://proxy.example.com:8080' }`
  - HTTPS 代理：`{ server: 'https://proxy.example.com:8080' }`
  - SOCKS5 代理：`{ server: 'socks5://proxy.example.com:1080' }`
  - 带认证：`{ server: 'http://proxy.example.com:8080', username: 'user', password: 'pass' }`

## 工作流程

1. 启动浏览器并访问 linux.do
2. **自动加载 Cookies 登录**（如果启用）或等待手动登录
3. 验证登录状态
4. 获取 200 个话题链接
5. 依次进入每个话题：
   - 滚动到第一个帖子
   - 跳转到页面底部
   - 检测并添加页面底部的新话题
   - 随机延迟 1-4 秒后进入下一个话题
6. 完成所有话题阅读后关闭浏览器

## 优势

- ✅ 可以真正在后台运行，不受浏览器标签页限制
- ✅ 不需要保持浏览器窗口在前台
- ✅ 可以设置为完全无头模式（`headless: true`）
- ✅ **支持 Cookies 自动登录**，无需每次手动登录
- ✅ **内置反检测机制**，隐藏无头浏览器特征
- ✅ 更稳定的定时器和滚动行为
- ✅ 详细的日志输出，带时间戳

## 浏览器控制台版本使用方法

1. 打开 linux.do 网站
2. 按 F12 打开开发者工具
3. 切换到 Console 标签
4. 复制 `linux-auto-view-v2.js` 的全部内容
5. 粘贴到控制台并按回车运行

**注意**：浏览器控制台版本在标签页切换到后台时会受到限制。

## 注意事项

- 首次运行需要手动登录账号
- 建议先设置 `headless: false` 观察运行情况
- 可以根据需要调整延迟时间，避免请求过于频繁
- 脚本会自动处理 404 页面和加载失败的情况

## 反检测机制

脚本内置了多种反检测技术，可以在无头模式下正常运行：

- **隐藏 webdriver 特征**：覆盖 `navigator.webdriver` 属性
- **模拟真实浏览器**：添加 `chrome` 对象和插件信息
- **禁用自动化标识**：使用 `--disable-blink-features=AutomationControlled`
- **完整浏览器环境**：设置语言、时区、权限等真实浏览器特征
- **真实 User-Agent**：使用最新的 Chrome User-Agent
