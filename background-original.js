// Background Script - Split View Chrome Extension

// 全局变量
let splitViewWindows = [];
let isExtensionActive = false;

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Split View Extension installed:', details);

  // 初始化默认设置
  await initializeDefaultSettings();

  // 如果是首次安装，打开欢迎页面
  if (details.reason === 'install') {
    await showWelcomePage();
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

// 显示欢迎页面
async function showWelcomePage() {
  try {
    await chrome.tabs.create({
      url: chrome.runtime.getURL('guide.html'),
      active: true
    });
  } catch (error) {
    console.error('Failed to show welcome page:', error);
  }
}

// 扩展启动时的处理
chrome.runtime.onStartup.addListener(async () => {
  console.log('Split View Extension started');
  isExtensionActive = true;

  // 检查是否有保存的窗口布局需要恢复
  await checkSavedLayout();
});

// 检查保存的布局
async function checkSavedLayout() {
  try {
    const settings = await chrome.storage.sync.get(['rememberLayout', 'lastSession']);

    if (settings.rememberLayout && settings.lastSession) {
      const session = settings.lastSession;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      // 如果距离上次使用不到1小时，询问是否恢复布局
      if (now - session.timestamp < oneHour) {
        await showRestoreLayoutNotification(session);
      }
    }
  } catch (error) {
    console.error('Failed to check saved layout:', error);
  }
}

// 显示恢复布局通知
async function showRestoreLayoutNotification(session) {
  try {
    // 创建通知（Chrome通知API可能不可用，使用badge作为替代）
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF6B6B' });

    // 保存会话信息供后续处理
    await chrome.storage.local.set({
      pendingRestore: session
    });

  } catch (error) {
    console.error('Failed to show restore notification:', error);
  }
}

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  switch (request.action) {
    case 'checkSplitViewSupport':
      handleCheckSplitViewSupport(sendResponse);
      return true; // 保持消息通道打开

    case 'createSplitView':
      handleCreateSplitView(request.data, sendResponse);
      return true;

    case 'createAlternativeSplit':
      handleCreateAlternativeSplit(request.data, sendResponse);
      return true;

    case 'restoreLayout':
      handleRestoreLayout(request.data, sendResponse);
      return true;

    case 'saveLayout':
      handleSaveLayout(request.data, sendResponse);
      return true;

    case 'getWindowsInfo':
      handleGetWindowsInfo(sendResponse);
      return true;

    default:
      console.warn('Unknown message action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// 处理Split View支持检测
async function handleCheckSplitViewSupport(sendResponse) {
  try {
    const supportInfo = await detectSplitViewSupport();
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

    return {
      hasNativeSupport,
      chromeVersion: version,
      platform: platformInfo.os,
      recommendations: getRecommendations(platformInfo.os, version)
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
    chrome.runtime.getPlatformInfo((info) => {
      resolve(info);
    });
  });
}

// 获取推荐信息
function getRecommendations(platform, version) {
  const recommendations = [];

  if (version < 111) {
    recommendations.push('建议升级Chrome到111或更高版本以获得更好的分屏体验');
  }

  if (platform === 'mac') {
    recommendations.push('macOS用户可以使用系统的分屏功能（Split View）');
  } else if (platform === 'win') {
    recommendations.push('Windows用户可以使用Windows Snap功能进行分屏');
  } else if (platform === 'linux') {
    recommendations.push('Linux用户可以使用窗口管理器的平铺功能');
  }

  recommendations.push('可以启用Chrome实验性功能：chrome://flags/#split-view');

  return recommendations;
}

// 处理创建Split View
async function handleCreateSplitView(data, sendResponse) {
  try {
    console.log('Creating Split View with data:', data);

    // 保存当前会话信息
    await saveCurrentSession(data);

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

// 尝试原生Split View（目前是占位符实现）
async function tryNativeSplitView(data) {
  // 目前Chrome没有公开的Split View API
  // 这里作为未来可能的API预留

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

    // 获取屏幕信息
    const screenInfo = await getScreenInfo();
    const currentWindow = await chrome.windows.getCurrent();

    // 计算窗口布局
    const layout = calculateOptimalLayout(screenInfo, currentWindow, mode);

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

    // 保存窗口信息
    splitViewWindows = [window1.id, window2.id];

    // 清除badge
    chrome.action.setBadgeText({ text: '' });

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

// 获取屏幕信息
async function getScreenInfo() {
  try {
    // 尝试使用Chrome System Display API
    if (chrome.system && chrome.system.display) {
      return new Promise((resolve) => {
        chrome.system.display.getInfo((displays) => {
          if (displays && displays.length > 0) {
            const primaryDisplay = displays.find(d => d.isPrimary) || displays[0];
            resolve({
              width: primaryDisplay.bounds.width,
              height: primaryDisplay.bounds.height,
              availWidth: primaryDisplay.workArea.width,
              availHeight: primaryDisplay.workArea.height
            });
          } else {
            // 回退到默认值
            resolve(getDefaultScreenInfo());
          }
        });
      });
    } else {
      // 回退到默认屏幕信息
      return getDefaultScreenInfo();
    }
  } catch (error) {
    console.warn('System Display API not available, using defaults:', error);
    return getDefaultScreenInfo();
  }
}

// 获取默认屏幕信息
function getDefaultScreenInfo() {
  return {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040 // 减去任务栏高度
  };
}

// 计算最优布局
function calculateOptimalLayout(screenInfo, currentWindow, mode) {
  const { availWidth, availHeight } = screenInfo;
  const taskbarHeight = 60; // 任务栏高度
  const windowGap = 10; // 窗口间隔

  const usableHeight = availHeight - taskbarHeight - 40; // 减去一些边距
  const usableWidth = availWidth - 40; // 减去一些边距

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
      return calculateOptimalLayout(screenInfo, currentWindow, 'side-by-side');
  }

  return layout;
}

// 保存当前会话
async function saveCurrentSession(data) {
  try {
    await chrome.storage.local.set({
      lastSession: {
        ...data,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Failed to save current session:', error);
  }
}

// 处理恢复布局
async function handleRestoreLayout(data, sendResponse) {
  try {
    const result = await createAlternativeSplitView(data);
    sendResponse({ success: true, data: result });
  } catch (error) {
    console.error('Failed to restore layout:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 处理保存布局
async function handleSaveLayout(data, sendResponse) {
  try {
    await chrome.storage.sync.set({
      savedLayouts: data.layouts || {}
    });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Failed to save layouts:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 处理获取窗口信息
async function handleGetWindowsInfo(sendResponse) {
  try {
    const windows = await chrome.windows.getAll({ populate: true });
    const currentWindow = await chrome.windows.getCurrent();

    const windowsInfo = windows.map(window => ({
      id: window.id,
      focused: window.focused,
      state: window.state,
      tabs: window.tabs ? window.tabs.length : 0,
      width: window.width,
      height: window.height
    }));

    sendResponse({
      success: true,
      data: {
        allWindows: windowsInfo,
        currentWindow: currentWindow.id,
        splitViewWindows: splitViewWindows
      }
    });

  } catch (error) {
    console.error('Failed to get windows info:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 窗口事件监听
chrome.windows.onRemoved.addListener((windowId) => {
  // 清理已关闭的分屏窗口
  splitViewWindows = splitViewWindows.filter(id => id !== windowId);
  console.log('Window removed:', windowId);
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }

  // 记录窗口焦点变化
  if (splitViewWindows.includes(windowId)) {
    console.log('Split view window focused:', windowId);
  }
});

// 扩展图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 如果有未处理的恢复布局请求，处理它
    const pendingRestore = await chrome.storage.local.get('pendingRestore');
    if (pendingRestore.pendingRestore) {
      await handleRestoreLayout(pendingRestore.pendingRestore, () => {});
      await chrome.storage.local.remove('pendingRestore');
      return;
    }

    // 否则打开popup（默认行为）
    console.log('Extension icon clicked on tab:', tab.id);

  } catch (error) {
    console.error('Failed to handle action click:', error);
  }
});

// 定期清理存储
chrome.alarms.create('cleanupStorage', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanupStorage') {
    await cleanupOldStorage();
  }
});

// 清理旧存储数据
async function cleanupOldStorage() {
  try {
    const data = await chrome.storage.local.get(['lastSession']);

    if (data.lastSession) {
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7天
      const now = Date.now();

      if (now - data.lastSession.timestamp > oneWeek) {
        await chrome.storage.local.remove('lastSession');
        console.log('Cleaned up old session data');
      }
    }
  } catch (error) {
    console.error('Failed to cleanup storage:', error);
  }
}