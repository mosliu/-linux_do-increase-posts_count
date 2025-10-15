# 快速开始指南

## 方法一：使用 Cookies 登录（推荐，支持无头模式）

### 步骤 1：复制 Cookie 字符串（最简单）

1. 打开浏览器访问 https://linux.do 并登录
2. 按 `F12` 打开开发者工具
3. 切换到 **Network (网络)** 标签
4. 刷新页面 (`F5`)
5. 点击第一个请求（通常是 `linux.do`）
6. 在右侧找到 **Request Headers (请求头)**
7. 找到 `Cookie:` 这一行，复制完整的 Cookie 字符串

### 步骤 2：保存到 cookies.txt

在项目根目录创建 `cookies.txt` 文件，粘贴刚才复制的 Cookie 字符串。

**示例格式：**
```
_t=xxx; _forum_session=yyy; cf_clearance=zzz; ...
```

### 步骤 3：安装依赖

```bash
npm install
npm run install-browser
```

### 步骤 4：运行脚本

```bash
npm start
```

脚本会自动检测 `cookies.txt` 并转换为 `cookies.json`。

**如果要使用无头模式（完全后台运行）：**

编辑 `linux-auto-view-playwright.js`，修改：
```javascript
headless: true,  // 改为 true
```

---

## 方法二：手动登录（适合测试）

### 步骤 1：安装依赖

```bash
npm install
npm run install-browser
```

### 步骤 2：修改配置

编辑 `linux-auto-view-playwright.js`，修改：
```javascript
useCookies: false,  // 改为 false
```

### 步骤 3：运行脚本

```bash
npm start
```

浏览器会自动打开，你有 30 秒时间手动登录。

---

## 常见问题

### Q: Cookies 过期了怎么办？

A: 重新从浏览器复制 Cookie 字符串，替换 `cookies.txt` 文件内容，删除 `cookies.json`，然后重新运行脚本。

### Q: 如何查看脚本运行状态？

A: 控制台会输出详细的日志，包括：
- 当前正在访问的话题
- 发现的新话题数量
- 登录状态验证结果

### Q: 脚本运行多久？

A: 取决于话题数量（默认 200 个），每个话题大约需要 5-10 秒，总共约 20-30 分钟。

### Q: 可以中途停止吗？

A: 可以，按 `Ctrl+C` 停止脚本。

### Q: 如何修改话题数量？

A: 编辑 `linux-auto-view-playwright.js`，修改：
```javascript
maxTopicsLength: 200,  // 改为你想要的数量
```

---

## 文件说明

- `export-cookies.js` - 在浏览器控制台运行，用于导出 Cookies
- `cookies.json` - 存储你的登录 Cookies（不要分享给别人！）
- `cookies.example.json` - Cookies 文件格式示例
- `linux-auto-view-playwright.js` - 主脚本
- `package.json` - 项目依赖配置
