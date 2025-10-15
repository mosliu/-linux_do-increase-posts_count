const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('Cookies 调试工具');
console.log('='.repeat(80));

const cookiesPath = path.join(__dirname, 'cookies.json');

// 检查文件是否存在
if (!fs.existsSync(cookiesPath)) {
    console.error('❌ cookies.json 文件不存在！');
    console.log('');
    console.log('请先运行以下步骤：');
    console.log('1. 打开浏览器访问 https://linux.do 并登录');
    console.log('2. 按 F12 打开开发者工具');
    console.log('3. 切换到 Console 标签');
    console.log('4. 复制 export-cookies.js 的内容并运行');
    console.log('5. 将输出的 JSON 保存为 cookies.json');
    process.exit(1);
}

// 读取并解析 cookies
let cookies;
try {
    const cookiesData = fs.readFileSync(cookiesPath, 'utf-8');
    cookies = JSON.parse(cookiesData);
    console.log(`✅ 成功读取 cookies.json 文件`);
    console.log(`   找到 ${cookies.length} 个 Cookies`);
} catch (error) {
    console.error('❌ 解析 cookies.json 失败:', error.message);
    process.exit(1);
}

console.log('');
console.log('Cookies 详情:');
console.log('-'.repeat(80));

let hasImportantCookies = false;
const importantCookieNames = ['_t', '__profilin', '_forum_session'];

cookies.forEach((cookie, index) => {
    const isImportant = importantCookieNames.some(name => cookie.name.includes(name));
    if (isImportant) {
        hasImportantCookies = true;
    }
    
    const marker = isImportant ? '⭐' : '  ';
    console.log(`${marker} [${index + 1}] ${cookie.name}`);
    console.log(`     Domain: ${cookie.domain}`);
    console.log(`     Path: ${cookie.path}`);
    console.log(`     Secure: ${cookie.secure}`);
    console.log(`     Value: ${cookie.value.substring(0, 30)}...`);
    console.log('');
});

console.log('-'.repeat(80));
console.log('');

// 检查关键配置
console.log('配置检查:');
let hasIssues = false;

// 检查 domain
const wrongDomains = cookies.filter(c => 
    c.domain !== '.linux.do' && 
    c.domain !== 'linux.do' && 
    !c.domain.endsWith('.linux.do')
);
if (wrongDomains.length > 0) {
    console.log('⚠️  警告: 发现不正确的 domain 设置');
    wrongDomains.forEach(c => {
        console.log(`    - ${c.name}: ${c.domain} (应该是 .linux.do)`);
    });
    hasIssues = true;
} else {
    console.log('✅ Domain 设置正确');
}

// 检查重要 cookies
if (!hasImportantCookies) {
    console.log('⚠️  警告: 未找到重要的认证 Cookies (_t, __profilin 等)');
    console.log('    请确保在登录状态下导出 Cookies');
    hasIssues = true;
} else {
    console.log('✅ 找到重要的认证 Cookies');
}

// 检查 secure 标志
const insecureCookies = cookies.filter(c => !c.secure);
if (insecureCookies.length > 0) {
    console.log('⚠️  警告: 部分 Cookies 的 secure 标志为 false');
    console.log('    建议设置为 true (因为 linux.do 使用 HTTPS)');
    hasIssues = true;
} else {
    console.log('✅ Secure 标志设置正确');
}

console.log('');
console.log('='.repeat(80));

if (hasIssues) {
    console.log('❌ 发现配置问题，建议重新导出 Cookies');
    console.log('');
    console.log('修复步骤:');
    console.log('1. 确保在浏览器中已登录 linux.do');
    console.log('2. 重新运行 export-cookies.js');
    console.log('3. 确保导出的 domain 为 ".linux.do"');
    console.log('4. 确保 secure 为 true');
} else {
    console.log('✅ Cookies 配置看起来正常');
    console.log('');
    console.log('如果仍然无法登录，请尝试:');
    console.log('1. 在浏览器中退出登录后重新登录');
    console.log('2. 重新导出 Cookies');
    console.log('3. 检查网络连接和代理设置');
}

console.log('='.repeat(80));
