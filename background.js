// 简化版Background Script - 专注于核心功能
// 修复消息传递和权限问题

console.log('Background script starting...');

// 扩展安装时的初始化 - 检查API可用性
if (chrome.runtime && chrome.runtime.onInstalled) {
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
} else {
  console.error('Chrome runtime onInstalled API not available');
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
    console.log('Default settings initialized:', defaultSettings);

  } catch (error) {
    console.error('Failed to initialize default settings:', error);
  }
}

// 处理来自popup的消息 - 检查API可用性
if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);

  // 处理不同类型的消息
  switch (request.action) {
  
    case 'createSplitScreen':
      handleCreateSplitScreen(request.data, sendResponse);
      return true;

  
    default:
      console.warn('Unknown message action:', request.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});
} else {
  console.error('Chrome runtime onMessage API not available');
}


// 处理创建分屏
async function handleCreateSplitScreen(data, sendResponse) {
  try {
    console.log('Creating split screen with data:', data);

    const result = await createSplitScreenView(data);
    sendResponse({ success: true, data: result });

  } catch (error) {
    console.error('Failed to create split screen:', error);
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

    console.log('Creating split screen windows for:', { website1, website2 });

    // 获取屏幕信息
    const screenInfo = await getScreenInfo();
    const screenWidth = screenInfo.width;
    const screenHeight = screenInfo.height;

    console.log('Using screen dimensions:', { screenWidth, screenHeight });

    // 计算左右分屏布局
    const windowGap = 2; // 窗口间隙
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

    console.log('Split screen windows created successfully:', {
      window1: window1.id,
      window2: window2.id
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
    console.error('Failed to create split screen view:', error);
    throw error;
  }
}

// 获取真实屏幕信息
async function getScreenInfo() {
  try {
    // 获取所有显示器信息
    const screens = await chrome.system.display.getInfo();
    if (screens && screens.length > 0) {
      // 使用主显示器（第一个显示器）
      const primaryScreen = screens[0];
      console.log('Detected screen info:', primaryScreen);
      return {
        width: primaryScreen.workArea.width || primaryScreen.bounds.width,
        height: primaryScreen.workArea.height || primaryScreen.bounds.height
      };
    }
  } catch (error) {
    console.warn('Failed to get screen info via API, using fallback:', error);
  }

  // 回退方案：使用window.screen获取屏幕信息
  return {
    width: window.screen.availWidth || 1920,
    height: window.screen.availHeight || 1080
  };
}


// 窗口事件监听 - 检查API可用性
if (chrome.windows && chrome.windows.onRemoved) {
  chrome.windows.onRemoved.addListener((windowId) => {
    console.log('Window removed:', windowId);
  });
} else {
  console.error('Chrome windows onRemoved API not available');
}

if (chrome.windows && chrome.windows.onFocusChanged) {
  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      return;
    }
    console.log('Window focus changed:', windowId);
  });
} else {
  console.error('Chrome windows onFocusChanged API not available');
}

// 扩展启动时的处理 - 检查API可用性
if (chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(async () => {
    console.log('Split View Extension started');
  try {
    // 简单的启动初始化
    console.log('Extension startup completed');
  } catch (error) {
    console.error('Failed to handle startup:', error);
  }
});
} else {
  console.error('Chrome runtime onStartup API not available');
}

// 错误处理 - 检查API是否可用
if (chrome.runtime && typeof chrome.runtime.onError === 'function') {
  chrome.runtime.onError.addListener((error) => {
    console.error('Chrome runtime error:', error);
  });
} else {
  console.log('Chrome runtime onError API not available');
}

console.log('Background script loaded successfully');