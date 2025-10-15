const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 配置参数
const CONFIG = {
    maxTopicsLength: 20,           // 获取话题数量
    loginUrl: 'https://linux.do',   // 登录页面URL
    headless: true,                // 是否无头模式（false可以看到浏览器运行）
    scrollDelay: 500,               // 滚动延迟（毫秒）
    readDelay: 2000,                // 阅读延迟（毫秒）
    enterTopicDelay: 5000,          // 进入话题延迟（毫秒）
    cookiesFile: 'cookies.json',    // Cookies 文件路径
    useCookies: true,               // 是否使用 Cookies 登录
    timeout: 120000,                // 页面加载超时时间（毫秒，默认 2 分钟）
    proxy: null,                    // 代理设置，格式：{ server: 'http://proxy.example.com:8080', username: 'user', password: 'pass' }
};

// 日志函数
const log = {
    info: (msg, ...args) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [INFO]`, msg, ...args);
    },
    debug: (msg, ...args) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [DEBUG]`, msg, ...args);
    },
    error: (msg, ...args) => {
        const timestamp = new Date().toLocaleTimeString();
        console.error(`[${timestamp}] [ERROR]`, msg, ...args);
    }
};

// 随机延迟 1-4 秒
function randomDelay() {
    return Math.floor(Math.random() * 3000) + 1000; // 1000-4000ms
}

// 等待函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取话题列表
async function getTopics(page, maxTopicsLength) {
    log.info('开始获取话题列表...');
    let topicListViewNum = 0;

    while (true) {
        const topicItemList = await page.$$('.topic-list-body tr.topic-list-item:not(.pinned) a.raw-topic-link');
        log.debug(`当前话题数量: ${topicItemList.length}`);

        // 如果已经达到最大话题数量则返回
        if (topicItemList.length >= maxTopicsLength) {
            log.info(`已获取到 ${topicItemList.length} 个话题`);
            return topicItemList;
        }

        // 当前要滑动到的话题
        if (topicListViewNum < topicItemList.length) {
            const topic = topicItemList[topicListViewNum];
            log.debug(`滚动到话题 #${topicListViewNum}`);
            
            await topic.scrollIntoViewIfNeeded();
            topicListViewNum += 5;
            await sleep(CONFIG.scrollDelay);
        } else {
            // 没有新话题，等待加载
            log.debug('等待新话题加载...');
            await sleep(3000);
        }
    }
}

// 阅读帖子
async function readPosts(page, topics) {
    log.info('开始阅读帖子...');

    // 等待页面加载
    await sleep(CONFIG.enterTopicDelay);

    // 检查是否是 404 页面
    const is404 = await page.$('.page-not-found-topics .not-found-topic a');
    if (is404) {
        log.info('404 页面，跳过');
        return;
    }

    // 检查是否有帖子流
    const postListDom = await page.$('.post-stream');
    if (!postListDom) {
        log.info('没有回复列表，等待加载...');
        await sleep(5000);
        
        // 重新检查
        const postListDomRetry = await page.$('.post-stream');
        if (!postListDomRetry) {
            log.error('帖子流加载失败，跳过');
            return;
        }
    }

    // 滚动到第一个帖子
    const firstPost = await page.$('.post-stream .topic-post');
    if (firstPost) {
        log.info('滚动到第一个帖子');
        await firstPost.scrollIntoViewIfNeeded();
        await sleep(CONFIG.readDelay);
    }

    // 跳到页面底部
    log.info('跳转到页面底部');
    await page.keyboard.press('End');
    await sleep(3000);

    // 检查页面底部是否有新话题列表
    const newTopicList = await page.$$('.topic-list-body tr.topic-list-item:not(.pinned) a.raw-topic-link');
    
    if (newTopicList.length > 0) {
        log.info(`发现 ${newTopicList.length} 个新话题`);
        
        for (const topic of newTopicList) {
            const href = await topic.getAttribute('href');
            const text = await topic.innerText();
            
            // 避免重复添加
            if (!topics.includes(href)) {
                log.info(`添加新话题: ${href} 《${text}》`);
                topics.push(href);
            }
        }
    } else {
        log.info('页面底部没有发现新话题');
    }
}

// 进入话题并阅读
async function enterAndReadTopics(page, topics) {
    while (topics.length > 0) {
        const topicPath = topics.shift();
        const topicUrl = `https://linux.do${topicPath}`;
        
        log.info(`将要阅读帖子 (剩余 ${topics.length}): ${topicUrl}`);
        
        try {
            await page.goto(topicUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
            await readPosts(page, topics);
            
            // 随机延迟 1-4 秒
            const delay = randomDelay();
            log.info(`等待 ${delay}ms 后进入下一个话题`);
            await sleep(delay);
        } catch (error) {
            log.error(`访问话题失败: ${topicUrl}`, error.message);
            await sleep(3000);
        }
    }
    
    log.info('所有话题已阅读完成！');
}

// 从 cookies.txt 转换为 cookies.json
function convertCookiesTxtToJson() {
    const txtPath = path.join(__dirname, 'cookies.txt');
    const jsonPath = path.join(__dirname, CONFIG.cookiesFile);
    
    if (!fs.existsSync(txtPath)) {
        return false;
    }
    
    try {
        log.info('检测到 cookies.txt 文件，开始转换...');
        const cookieString = fs.readFileSync(txtPath, 'utf-8').trim();
        
        if (!cookieString) {
            log.error('cookies.txt 文件为空');
            return false;
        }
        
        // 解析 Cookie 字符串
        const cookies = cookieString.split(';').map(cookie => {
            const [name, ...valueParts] = cookie.trim().split('=');
            const value = valueParts.join('=');
            
            if (!name || !value) return null;
            
            return {
                name: name.trim(),
                value: value.trim(),
                domain: '.linux.do',
                path: '/',
                httpOnly: false,
                secure: true,
                sameSite: 'Lax'
            };
        }).filter(cookie => cookie !== null);
        
        if (cookies.length === 0) {
            log.error('未能解析任何有效的 Cookies');
            return false;
        }
        
        // 保存为 JSON
        fs.writeFileSync(jsonPath, JSON.stringify(cookies, null, 2), 'utf-8');
        log.info(`✅ 成功转换 ${cookies.length} 个 Cookies 到 cookies.json`);
        
        // 显示重要的 Cookies
        const importantCookies = cookies.filter(c => 
            c.name.includes('_t') || c.name.includes('session') || c.name.includes('cf_clearance')
        );
        if (importantCookies.length > 0) {
            log.info('重要的认证 Cookies:');
            importantCookies.forEach(c => {
                log.info(`  - ${c.name}`);
            });
        }
        
        return true;
    } catch (error) {
        log.error('转换 cookies.txt 失败:', error.message);
        return false;
    }
}

// 加载 Cookies
function loadCookies() {
    const cookiesPath = path.join(__dirname, CONFIG.cookiesFile);
    
    // 如果 cookies.json 不存在，尝试从 cookies.txt 转换
    if (!fs.existsSync(cookiesPath)) {
        log.info('cookies.json 不存在，尝试从 cookies.txt 转换...');
        if (!convertCookiesTxtToJson()) {
            log.error(`Cookies 文件不存在: ${cookiesPath}`);
            log.info('请将浏览器的 Cookie 字符串保存到 cookies.txt 文件中');
            log.info('或者运行 export-cookies.js 导出 Cookies');
            return null;
        }
    }
    
    try {
        const cookiesData = fs.readFileSync(cookiesPath, 'utf-8');
        const cookies = JSON.parse(cookiesData);
        log.info(`成功加载 ${cookies.length} 个 Cookies`);
        return cookies;
    } catch (error) {
        log.error('加载 Cookies 失败:', error.message);
        return null;
    }
}

// 主函数
async function main() {
    log.info('启动 Playwright 浏览器...');
    
    const browser = await chromium.launch({
        headless: CONFIG.headless,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled', // 禁用自动化控制特征
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });
    
    // 构建上下文配置
    const contextOptions = {
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // 添加额外的浏览器特征
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
        permissions: ['geolocation', 'notifications'],
        colorScheme: 'light',
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        javaScriptEnabled: true
    };
    
    // 如果配置了代理，添加到上下文选项中
    if (CONFIG.proxy) {
        contextOptions.proxy = CONFIG.proxy;
        log.info(`使用代理: ${CONFIG.proxy.server}`);
    }
    
    const context = await browser.newContext(contextOptions);
    
    const page = await context.newPage();
    
    // 注入反检测脚本
    await page.addInitScript(() => {
        // 覆盖 navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        
        // 覆盖 chrome 对象
        window.chrome = {
            runtime: {}
        };
        
        // 覆盖 permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
        
        // 覆盖 plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });
        
        // 覆盖 languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['zh-CN', 'zh', 'en']
        });
    });
    
    try {
        // 如果启用了 Cookies 登录
        if (CONFIG.useCookies) {
            const cookies = loadCookies();
            
            if (cookies) {
                log.info('正在设置 Cookies...');
                await context.addCookies(cookies);
                log.info('✅ Cookies 设置成功');
            } else {
                log.info('⚠️ 未能加载 Cookies，将使用手动登录方式');
                CONFIG.useCookies = false;
            }
        }
        
        // 访问首页
        log.info(`访问 ${CONFIG.loginUrl}`);
        await page.goto(CONFIG.loginUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
        
        // 如果没有使用 Cookies，等待用户手动登录
        if (!CONFIG.useCookies) {
            log.info('请在浏览器中登录，脚本将在 30 秒后继续...');
            await sleep(30000);
        } else {
            log.info('使用 Cookies 登录，等待 5 秒验证登录状态...');
            await sleep(5000);
            
            // 验证是否登录成功 - 尝试多个选择器
            let isLoggedIn = await page.$('.header-dropdown-toggle.current-user');
            if (!isLoggedIn) {
                isLoggedIn = await page.$('.d-header .current-user');
            }
            if (!isLoggedIn) {
                isLoggedIn = await page.$('#current-user');
            }
            
            if (isLoggedIn) {
                log.info('✅ 登录验证成功');
                
                // 尝试获取用户名
                try {
                    const username = await isLoggedIn.textContent();
                    if (username) {
                        log.info(`当前用户: ${username.trim()}`);
                    }
                } catch (e) {
                    // 忽略获取用户名失败
                }
            } else {
                log.error('⚠️ Cookies 可能已过期或格式不正确');
                log.info('请检查:');
                log.info('  1. cookies.json 文件中的 domain 是否为 ".linux.do"');
                log.info('  2. 重新运行 export-cookies.js 导出最新的 Cookies');
                log.info('  3. 确保在登录状态下导出 Cookies');
                log.info('');
                log.info('等待 30 秒供手动登录...');
                await sleep(30000);
            }
        }
        
        // 获取话题列表
        const topicElements = await getTopics(page, CONFIG.maxTopicsLength);
        
        // 提取话题链接
        const topics = [];
        for (const topic of topicElements) {
            const href = await topic.getAttribute('href');
            const text = await topic.innerText();
            log.info(`话题 #${topics.length}: ${href} 《${text}》`);
            topics.push(href);
        }
        
        log.info(`共获取到 ${topics.length} 个话题，开始阅读...`);
        
        // 开始阅读话题
        await enterAndReadTopics(page, topics);
        
    } catch (error) {
        log.error('脚本执行出错:', error);
    } finally {
        log.info('关闭浏览器...');
        await browser.close();
    }
}

// 运行脚本
main().catch(console.error);
