// 简化版Background Script - 专注于核心功能
// 修复消息传递和权限问题

console.log('Background script starting...');

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Split View Extension installed:', details);

  // 初始化默认设置
  try {
    await initializeDefaultSettings();

    // 如果是首次安装，显示欢迎信息
    if (details.reason === 'install') {
      console.log('First time installation detected');
    }
  } catch (error) {
    console.error('Failed to initialize extension:', error);
  }
});

// 初始化默认设置
async function initializeDefaultSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'autoDetect', 'rememberLayout', 'firstTime'
    ]);

    const defaultSettings = {
      autoDetect: settings.autoDetect !== undefined ? settings.autoDetect : true,
      rememberLayout: settings.rememberLayout !== undefined ? settings.rememberLayout : true,
      firstTime: settings.firstTime !== undefined ? settings.firstTime : false
    };

    await chrome.storage.sync.set(defaultSettings);
    console.log('Default settings initialized:', defaultSettings);

  } catch (error) {
    console.error('Failed to initialize default settings:', error);
  }
}

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  // 处理不同类型的消息
  switch (request.action) {
    case 'checkSplitViewSupport':
      handleCheckSplitViewSupport(sendResponse);
      return true; // 保持消息通道打开

    case 'createAlternativeSplit':
      handleCreateAlternativeSplit(request.data, sendResponse);
      return true;

    case 'createSplitView':
      handleCreateSplitView(request.data, sendResponse);
      return true;

    default:
      console.warn('Unknown message action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// 处理Split View支持检测
async function handleCheckSplitViewSupport(sendResponse) {
  try {
    console.log('Checking Split View support...');

    const supportInfo = await detectSplitViewSupport();
    console.log('Split View support info:', supportInfo);

    sendResponse({ success: true, data: supportInfo });
  } catch (error) {
    console.error('Failed to check Split View support:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 检测Split View支持
async function detectSplitViewSupport() {
  try {
    // 获取Chrome版本信息
    const userAgent = navigator.userAgent;
    const chromeVersion = userAgent.match(/Chrome\/(\d+)/);
    const version = chromeVersion ? parseInt(chromeVersion[1]) : 0;

    // 检测操作系统
    const platformInfo = await getPlatformInfo();

    // 基于版本和平台判断支持情况
    const hasNativeSupport = version >= 111 && (
      platformInfo.os === 'mac' ||
      platformInfo.os === 'win' ||
      platformInfo.os === 'linux'
    );

    const recommendations = [];
    if (version < 111) {
      recommendations.push('建议升级Chrome到111或更高版本以获得更好的分屏体验');
    }
    recommendations.push('可以启用Chrome实验性功能：chrome://flags/#split-view');

    return {
      hasNativeSupport,
      chromeVersion: version,
      platform: platformInfo.os,
      recommendations
    };

  } catch (error) {
    console.error('Error detecting Split View support:', error);
    return {
      hasNativeSupport: false,
      chromeVersion: 0,
      platform: 'unknown',
      recommendations: ['无法检测Chrome版本信息']
    };
  }
}

// 获取平台信息
function getPlatformInfo() {
  return new Promise((resolve) => {
    try {
      chrome.runtime.getPlatformInfo((info) => {
        resolve(info);
      });
    } catch (error) {
      console.warn('Failed to get platform info:', error);
      resolve({ os: 'unknown' });
    }
  });
}

// 处理创建Split View
async function handleCreateSplitView(data, sendResponse) {
  try {
    console.log('Creating Split View with data:', data);

    // 尝试使用原生方法（如果可用）
    const result = await tryNativeSplitView(data);

    if (result.success) {
      sendResponse({ success: true, data: result });
    } else {
      // 回退到替代方案
      const alternativeResult = await createAlternativeSplitView(data);
      sendResponse({ success: true, data: alternativeResult });
    }

  } catch (error) {
    console.error('Failed to create Split View:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 尝试原生Split View（占位符实现）
async function tryNativeSplitView(data) {
  console.log('Native Split View API not available, falling back to alternative method');

  return {
    success: false,
    method: 'native',
    message: 'Native Split View API not available'
  };
}

// 处理创建替代分屏
async function handleCreateAlternativeSplit(data, sendResponse) {
  try {
    console.log('Creating alternative split view with data:', data);

    const result = await createAlternativeSplitView(data);
    sendResponse({ success: true, data: result });

  } catch (error) {
    console.error('Failed to create alternative split view:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 创建替代分屏视图
async function createAlternativeSplitView(data) {
  try {
    const { website1, website2, mode = 'side-by-side' } = data;

    if (!website1 || !website2) {
      throw new Error('需要提供两个网站URL');
    }

    console.log('Creating split windows for:', { website1, website2, mode });

    // 获取当前窗口信息
    let currentWindow;
    try {
      currentWindow = await chrome.windows.getCurrent();
    } catch (error) {
      console.warn('Failed to get current window, using defaults:', error);
      currentWindow = { width: 800, height: 600 };
    }

    // 计算窗口布局
    const layout = calculateOptimalLayout(currentWindow, mode);
    console.log('Calculated layout:', layout);

    // 创建第一个窗口
    const window1 = await chrome.windows.create({
      url: website1,
      width: layout.width1,
      height: layout.height,
      left: layout.left1,
      top: layout.top,
      focused: true,
      state: 'normal'
    });

    // 创建第二个窗口
    const window2 = await chrome.windows.create({
      url: website2,
      width: layout.width2,
      height: layout.height,
      left: layout.left2,
      top: layout.top,
      focused: false,
      state: 'normal'
    });

    console.log('Windows created successfully:', {
      window1: window1.id,
      window2: window2.id
    });

    return {
      success: true,
      method: 'alternative',
      windows: {
        window1: window1.id,
        window2: window2.id
      },
      layout: layout
    };

  } catch (error) {
    console.error('Failed to create alternative split view:', error);
    throw error;
  }
}

// 计算最优布局
function calculateOptimalLayout(currentWindow, mode) {
  // 使用默认屏幕尺寸
  const screenWidth = 1920;
  const screenHeight = 1080;
  const taskbarHeight = 60;
  const windowGap = 10;

  const usableHeight = screenHeight - taskbarHeight - 40;
  const usableWidth = screenWidth - 40;

  let layout = {
    width1: 0,
    width2: 0,
    height: usableHeight,
    left1: 20,
    left2: 20,
    top: 20
  };

  switch (mode) {
    case 'side-by-side':
      layout.width1 = Math.floor((usableWidth - windowGap) / 2);
      layout.width2 = Math.floor((usableWidth - windowGap) / 2);
      layout.left2 = layout.left1 + layout.width1 + windowGap;
      break;

    case 'top-bottom':
      layout.width1 = usableWidth;
      layout.width2 = usableWidth;
      layout.height = Math.floor((usableHeight - windowGap) / 2);
      layout.left2 = layout.left1;
      layout.top = layout.top + layout.height + windowGap;
      break;

    case 'focus':
      layout.width1 = Math.floor(usableWidth * 0.65);
      layout.width2 = Math.floor(usableWidth * 0.35) - windowGap;
      layout.left2 = layout.left1 + layout.width1 + windowGap;
      break;

    default:
      return calculateOptimalLayout(currentWindow, 'side-by-side');
  }

  return layout;
}

// 窗口事件监听
chrome.windows.onRemoved.addListener((windowId) => {
  console.log('Window removed:', windowId);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }
  console.log('Window focus changed:', windowId);
});

// 扩展启动时的处理
chrome.runtime.onStartup.addListener(async () => {
  console.log('Split View Extension started');
  try {
    // 简单的启动初始化
    console.log('Extension startup completed');
  } catch (error) {
    console.error('Failed to handle startup:', error);
  }
});

// 错误处理
chrome.runtime.onError?.addListener((error) => {
  console.error('Chrome runtime error:', error);
});

console.log('Background script loaded successfully');