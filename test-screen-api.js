// 测试屏幕API功能
console.log('开始测试屏幕API功能...');

// 测试chrome.system.display API
async function testSystemDisplayAPI() {
    try {
        console.log('测试 chrome.system.display.getInfo()...');

        if (chrome && chrome.system && chrome.system.display) {
            const displays = await chrome.system.display.getInfo();
            console.log('✅ 成功获取显示器信息:', displays);

            displays.forEach((display, index) => {
                console.log(`显示器 ${index + 1}:`, {
                    id: display.id,
                    name: display.name,
                    bounds: display.bounds,
                    workArea: display.workArea,
                    isPrimary: display.isPrimary
                });
            });

            return displays;
        } else {
            console.warn('❌ chrome.system.display API 不可用');
            return null;
        }
    } catch (error) {
        console.error('❌ 调用 chrome.system.display.getInfo() 失败:', error);
        return null;
    }
}

// 测试window.screen API
function testWindowScreenAPI() {
    console.log('测试 window.screen API...');

    const screenInfo = {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
        devicePixelRatio: window.devicePixelRatio
    };

    console.log('✅ window.screen 信息:', screenInfo);
    return screenInfo;
}

// 测试窗口创建权限
async function testWindowCreationPermission() {
    try {
        console.log('测试窗口创建权限...');

        if (chrome && chrome.windows) {
            // 测试获取当前窗口
            const currentWindow = await chrome.windows.getCurrent();
            console.log('✅ 成功获取当前窗口:', currentWindow);

            // 测试获取所有窗口
            const allWindows = await chrome.windows.getAll();
            console.log('✅ 成功获取所有窗口，数量:', allWindows.length);

            return true;
        } else {
            console.warn('❌ chrome.windows API 不可用');
            return false;
        }
    } catch (error) {
        console.error('❌ 测试窗口权限失败:', error);
        return false;
    }
}

// 测试完整的环境信息
async function runEnvironmentTest() {
    console.log('🚀 开始环境测试...');

    const results = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
    };

    // 测试系统显示API
    results.systemDisplay = await testSystemDisplayAPI();

    // 测试window screen API
    results.windowScreen = testWindowScreenAPI();

    // 测试窗口权限
    results.windowPermission = await testWindowCreationPermission();

    // 输出完整测试结果
    console.log('📊 完整环境测试结果:', results);

    return results;
}

// 如果在扩展环境中运行
if (typeof chrome !== 'undefined') {
    // 等待扩展完全加载后运行测试
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runEnvironmentTest);
    } else {
        runEnvironmentTest();
    }
} else {
    // 在普通网页中运行
    console.log('在普通网页环境中运行，仅测试基础API...');
    testWindowScreenAPI();
}

// 导出测试函数供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testSystemDisplayAPI,
        testWindowScreenAPI,
        testWindowCreationPermission,
        runEnvironmentTest
    };
}