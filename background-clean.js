// Background Script - Split View Extension
// 专注于核心功能，移除调试代码

// 扩展安装时的初始化
if (chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(async (details) => {
    try {
      await initializeDefaultSettings();

      if (details.reason === 'install') {
        // 首次安装的初始化逻辑
      }
    } catch (error) {
      // 静默处理初始化错误
    }
  });
}

// 初始化默认设置
async function initializeDefaultSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'rememberLayout', 'firstTime'
    ]);

    const defaultSettings = {
      rememberLayout: settings.rememberLayout !== undefined ? settings.rememberLayout : true,
      firstTime: settings.firstTime !== undefined ? settings.firstTime : false
    };

    await chrome.storage.sync.set(defaultSettings);
  } catch (error) {
    // 静默处理设置初始化错误
  }
}

// 处理来自popup的消息
if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'createSplitScreen':
        handleCreateSplitScreen(request.data, sendResponse);
        return true;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  });
}

// 处理创建分屏
async function handleCreateSplitScreen(data, sendResponse) {
  try {
    const result = await createSplitScreenView(data);
    sendResponse({ success: true, data: result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// 创建左右分屏视图
async function createSplitScreenView(data) {
  try {
    const { website1, website2 } = data;

    if (!website1 || !website2) {
      throw new Error('需要提供两个网站URL');
    }

    // 获取屏幕信息
    const screenInfo = await getScreenInfo();
    const screenWidth = screenInfo.width;
    const screenHeight = screenInfo.height;

    // 计算左右分屏布局
    const windowGap = 2;
    const windowWidth = Math.floor(screenWidth / 2) - Math.floor(windowGap / 2);
    const windowHeight = screenHeight;

    // 创建左侧窗口
    const window1 = await chrome.windows.create({
      url: website1,
      width: windowWidth,
      height: windowHeight,
      left: 0,
      top: 0,
      focused: true,
      state: 'normal'
    });

    // 创建右侧窗口
    const window2 = await chrome.windows.create({
      url: website2,
      width: windowWidth,
      height: windowHeight,
      left: windowWidth + windowGap,
      top: 0,
      focused: false,
      state: 'normal'
    });

    return {
      success: true,
      method: 'split-screen',
      windows: {
        window1: window1.id,
        window2: window2.id
      },
      layout: {
        width: windowWidth,
        height: windowHeight,
        gap: windowGap
      }
    };

  } catch (error) {
    throw error;
  }
}

// 获取屏幕信息
async function getScreenInfo() {
  try {
    const screens = await chrome.system.display.getInfo();
    if (screens && screens.length > 0) {
      const primaryScreen = screens[0];
      return {
        width: primaryScreen.workArea.width || primaryScreen.bounds.width,
        height: primaryScreen.workArea.height || primaryScreen.bounds.height
      };
    }
  } catch (error) {
    // 使用回退方案
  }

  // 回退方案：使用window.screen获取屏幕信息
  return {
    width: window.screen.availWidth || 1920,
    height: window.screen.availHeight || 1080
  };
}

// 窗口事件监听
if (chrome.windows && chrome.windows.onRemoved) {
  chrome.windows.onRemoved.addListener((windowId) => {
    // 窗口关闭时的清理逻辑
  });
}

if (chrome.windows && chrome.windows.onFocusChanged) {
  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      return;
    }
    // 窗口焦点变更时的处理逻辑
  });
}