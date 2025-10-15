// ============================================================================
// 方法一：从开发者工具手动导出（推荐，可以获取 HttpOnly Cookie）
// ============================================================================
// 1. 打开 linux.do 网站并登录
// 2. 按 F12 打开开发者工具
// 3. 切换到 Application (或 Storage) 标签
// 4. 左侧找到 Cookies -> https://linux.do
// 5. 右键点击任意 Cookie -> "Show Requests With This Cookie" 或直接查看
// 6. 手动复制 Cookie 字符串（见下方说明）
//
// 或者使用方法二的自动脚本（但无法获取 HttpOnly Cookie）
// ============================================================================

console.log('='.repeat(80));
console.log('Cookie 导出工具 - 请选择一个方法');
console.log('='.repeat(80));
console.log('');
console.log('【方法一：手动从浏览器复制（推荐）】');
console.log('');
console.log('步骤：');
console.log('1. 按 F12 打开开发者工具');
console.log('2. 切换到 "Network" (网络) 标签');
console.log('3. 刷新页面 (F5)');
console.log('4. 点击任意请求（如第一个 linux.do 请求）');
console.log('5. 在右侧找到 "Request Headers" (请求头)');
console.log('6. 找到 "Cookie:" 这一行，复制完整的 Cookie 字符串');
console.log('7. 运行下面的转换函数');
console.log('');
console.log('然后在控制台运行：');
console.log('convertCookieString("粘贴你复制的 Cookie 字符串")');
console.log('');
console.log('='.repeat(80));
console.log('');
console.log('【方法二：自动导出（不包含 HttpOnly Cookie）】');
console.log('');
console.log('运行: exportCookiesAuto()');
console.log('');
console.log('='.repeat(80));

// 转换 Cookie 字符串为 JSON 格式
window.convertCookieString = function(cookieString) {
    console.log('');
    console.log('开始转换 Cookie 字符串...');
    
    if (!cookieString || typeof cookieString !== 'string') {
        console.error('❌ 请提供有效的 Cookie 字符串');
        console.log('');
        console.log('示例格式：');
        console.log('convertCookieString("_t=xxx; _forum_session=yyy; fp=zzz")');
        return;
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
    
    console.log(`✅ 成功解析 ${cookies.length} 个 Cookies`);
    console.log('');
    
    // 检查重要的 Cookie
    const importantCookies = ['_t', '_forum_session', 'cf_clearance'];
    const foundImportant = cookies.filter(c => 
        importantCookies.some(name => c.name.includes(name))
    );
    
    console.log('重要的认证 Cookies:');
    if (foundImportant.length > 0) {
        foundImportant.forEach(c => {
            console.log(`  ✅ ${c.name}: ${c.value.substring(0, 30)}...`);
        });
    } else {
        console.log('  ⚠️  未找到重要的认证 Cookies');
    }
    console.log('');
    
    // 输出 JSON
    const jsonOutput = JSON.stringify(cookies, null, 2);
    
    console.log('='.repeat(80));
    console.log('复制下面的 JSON 内容，保存到 cookies.json 文件：');
    console.log('='.repeat(80));
    console.log(jsonOutput);
    console.log('='.repeat(80));
    
    // 尝试复制到剪贴板
    if (navigator.clipboard) {
        navigator.clipboard.writeText(jsonOutput).then(() => {
            console.log('');
            console.log('✅ JSON 已复制到剪贴板！直接粘贴到 cookies.json 文件即可');
        }).catch(err => {
            console.log('');
            console.log('⚠️ 无法自动复制，请手动复制上面的 JSON 内容');
        });
    }
    
    return cookies;
};

// 自动导出（不包含 HttpOnly Cookie）
window.exportCookiesAuto = async function() {
    console.log('');
    console.log('⚠️  注意：此方法无法获取 HttpOnly Cookie（如 _t, _forum_session）');
    console.log('   建议使用方法一手动复制完整的 Cookie 字符串');
    console.log('');
    
    // 检查是否已登录
    const userElement = document.querySelector('.header-dropdown-toggle.current-user, .d-header .current-user');
    if (!userElement) {
        console.error('❌ 检测到未登录状态，请先登录！');
        return;
    }
    
    console.log('✅ 检测到已登录状态');
    
    // 获取所有可访问的 cookies
    const cookies = document.cookie.split(';').map(cookie => {
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
    
    console.log(`找到 ${cookies.length} 个 Cookies（不包含 HttpOnly）`);
    
    const jsonOutput = JSON.stringify(cookies, null, 2);
    
    console.log('='.repeat(80));
    console.log(jsonOutput);
    console.log('='.repeat(80));
    
    if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(jsonOutput);
            console.log('✅ 已复制到剪贴板');
        } catch (err) {
            console.log('⚠️ 请手动复制');
        }
    }
    
    return cookies;
};

console.log('');
console.log('✅ 工具已加载，请选择一个方法开始导出');
console.log('');
