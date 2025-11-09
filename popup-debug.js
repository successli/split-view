// 调试版本的popup.js
// 修复点击无响应问题

// 全局变量
let currentMode = 'side-by-side';
let splitViewEnabled = false;
let currentTab = null;

// 预设模板配置
const templates = {
  work: {
    name: '工作模式',
    websites: ['https://github.com', 'https://docs.google.com']
  },
  study: {
    name: '学习模式',
    websites: ['https://www.google.com', 'https://www.wikipedia.org']
  },
  ai: {
    name: 'AI对话',
    websites: ['https://chat.openai.com', 'https://claude.ai']
  },
  entertainment: {
    name: '娱乐模式',
    websites: ['https://www.bilibili.com', 'https://www.zhihu.com']
  }
};

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup DOM loaded, initializing...');
  try {
    await initializePopup();
    setupEventListeners();
    loadSettings();
    console.log('Popup initialized successfully');
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showError('初始化失败: ' + error.message);
  }
});

// 初始化弹窗
async function initializePopup() {
  try {
    console.log('Initializing popup...');

    // 获取当前标签页
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tabs[0];
      console.log('Current tab:', currentTab?.url);
    } catch (error) {
      console.warn('Failed to get current tab:', error);
      currentTab = null;
    }

    // 检测Split View状态
    await checkSplitViewStatus();

    // 恢复上次的设置
    await restoreLastSettings();

  } catch (error) {
    console.error('初始化失败:', error);
    showError('初始化失败，请重试');
  }
}

// 检测Split View状态
async function checkSplitViewStatus() {
  const statusChecking = document.getElementById('status-checking');
  const statusEnabled = document.getElementById('status-enabled');
  const statusDisabled = document.getElementById('status-disabled');

  try {
    if (statusChecking) statusChecking.style.display = 'flex';
    if (statusEnabled) statusEnabled.style.display = 'none';
    if (statusDisabled) statusDisabled.style.display = 'none';

    // 检测Chrome版本和Split View支持
    const chromeInfo = await getChromeInfo();
    const hasSplitView = await detectSplitViewSupport();

    setTimeout(() => {
      if (statusChecking) statusChecking.style.display = 'none';

      if (hasSplitView) {
        if (statusEnabled) statusEnabled.style.display = 'flex';
        if (statusDisabled) statusDisabled.style.display = 'none';
        splitViewEnabled = true;
      } else {
        if (statusEnabled) statusEnabled.style.display = 'none';
        if (statusDisabled) statusDisabled.style.display = 'flex';
        splitViewEnabled = false;
      }
    }, 1000);

  } catch (error) {
    console.error('检测Split View状态失败:', error);
    if (statusChecking) statusChecking.style.display = 'none';
    if (statusDisabled) statusDisabled.style.display = 'flex';
    splitViewEnabled = false;
  }
}

// 获取Chrome信息
async function getChromeInfo() {
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

// 检测Split View支持
async function detectSplitViewSupport() {
  try {
    // 尝试检测Chrome实验性功能
    const version = navigator.userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = version ? parseInt(version[1]) : 0;
    console.log('Chrome version:', chromeVersion);

    // Chrome 111+ 版本可能支持split-view
    return chromeVersion >= 111;
  } catch (error) {
    console.error('检测Split View支持失败:', error);
    return false;
  }
}

// 设置事件监听器
function setupEventListeners() {
  console.log('Setting up event listeners...');

  // 网站选择变化
  const website1 = document.getElementById('website1');
  const website2 = document.getElementById('website2');

  if (website1) {
    website1.addEventListener('change', (e) => {
      console.log('Website1 changed:', e.target.value);
      handleWebsiteSelect(e.target, 'custom-url1');
    });
  }

  if (website2) {
    website2.addEventListener('change', (e) => {
      console.log('Website2 changed:', e.target.value);
      handleWebsiteSelect(e.target, 'custom-url2');
    });
  }

  // 分屏模式切换
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Mode button clicked:', btn.dataset.mode);
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
    });
  });

  // 操作按钮
  const btnSplit = document.getElementById('btn-split');
  const btnAlternative = document.getElementById('btn-alternative');
  const btnGuide = document.getElementById('btn-guide');

  if (btnSplit) {
    btnSplit.addEventListener('click', () => {
      console.log('Split button clicked');
      startSplitView();
    });
  } else {
    console.error('btn-split not found');
  }

  if (btnAlternative) {
    btnAlternative.addEventListener('click', () => {
      console.log('Alternative button clicked');
      startAlternativeSplit();
    });
  } else {
    console.error('btn-alternative not found');
  }

  if (btnGuide) {
    btnGuide.addEventListener('click', () => {
      console.log('Guide button clicked');
      openGuide();
    });
  } else {
    console.error('btn-guide not found');
  }

  // 模板按钮
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Template button clicked:', btn.dataset.template);
      applyTemplate(btn.dataset.template);
    });
  });

  // 设置选项
  const autoDetect = document.getElementById('auto-detect');
  const rememberLayout = document.getElementById('remember-layout');

  if (autoDetect) {
    autoDetect.addEventListener('change', (e) => {
      console.log('Auto-detect changed:', e.target.checked);
      saveSetting('autoDetect', e.target.checked);
    });
  }

  if (rememberLayout) {
    rememberLayout.addEventListener('change', (e) => {
      console.log('Remember layout changed:', e.target.checked);
      saveSetting('rememberLayout', e.target.checked);
    });
  }

  console.log('Event listeners setup complete');
}

// 处理网站选择
function handleWebsiteSelect(selectElement, customUrlInputId) {
  const customUrlInput = document.getElementById(customUrlInputId);

  if (selectElement.value === 'custom') {
    if (customUrlInput) {
      customUrlInput.style.display = 'block';
      customUrlInput.focus();
    }
  } else {
    if (customUrlInput) {
      customUrlInput.style.display = 'none';
      customUrlInput.value = '';
    }
  }
}

// 开始分屏浏览
async function startSplitView() {
  console.log('Starting split view...');
  try {
    const website1 = getWebsiteUrl('website1', 'custom-url1');
    const website2 = getWebsiteUrl('website2', 'custom-url2');

    console.log('Websites selected:', { website1, website2 });

    if (!website1 || !website2) {
      showError('请选择要分屏浏览的网站');
      return;
    }

    // 验证URL格式
    if (!isValidUrl(website1) || !isValidUrl(website2)) {
      showError('请输入有效的网址');
      return;
    }

    // 保存当前设置
    if (document.getElementById('remember-layout')?.checked) {
      await saveCurrentLayout(website1, website2, currentMode);
    }

    if (splitViewEnabled) {
      // 使用原生Split View API（如果可用）
      await nativeSplitView(website1, website2);
    } else {
      // 使用替代方案
      await startAlternativeSplit();
    }

  } catch (error) {
    console.error('启动分屏失败:', error);
    showError('启动分屏失败: ' + error.message);
  }
}

// 验证URL格式
function isValidUrl(string) {
  try {
    // 如果是chrome://或类似协议，返回true
    if (string.startsWith('chrome://') || string.startsWith('about:')) {
      return true;
    }

    // 验证HTTP/HTTPS URL
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// 获取网站URL
function getWebsiteUrl(selectId, customInputId) {
  const select = document.getElementById(selectId);
  const customInput = document.getElementById(customInputId);

  if (!select) return null;

  if (select.value === 'current' && currentTab) {
    return currentTab.url;
  } else if (select.value === 'custom' && customInput) {
    return customInput.value.trim();
  } else {
    return select.value;
  }
}

// 原生Split View（占位符实现）
async function nativeSplitView(url1, url2) {
  // 目前Chrome没有公开的Split View API
  console.log('原生Split View暂不可用，使用替代方案');
  await startAlternativeSplit();
}

// 替代分屏方案
async function startAlternativeSplit() {
  console.log('Starting alternative split view...');
  try {
    const website1 = getWebsiteUrl('website1', 'custom-url1');
    const website2 = getWebsiteUrl('website2', 'custom-url2');

    if (!website1 || !website2) {
      showError('请选择要分屏浏览的网站');
      return;
    }

    console.log('Creating split windows for:', { website1, website2 });

    // 直接创建窗口，不依赖background script
    const currentWindow = await chrome.windows.getCurrent();
    const screenInfo = {
      width: window.screen.availWidth,
      height: window.screen.availHeight,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight
    };

    const layout = calculateWindowLayout(currentWindow, currentMode);
    console.log('Calculated layout:', layout);

    // 创建第一个窗口
    const window1 = await chrome.windows.create({
      url: website1,
      width: layout.width.width1,
      height: layout.height,
      left: layout.left.left1,
      top: layout.top,
      focused: true
    });

    // 创建第二个窗口
    const window2 = await chrome.windows.create({
      url: website2,
      width: layout.width.width2,
      height: layout.height,
      left: layout.left.left2,
      top: layout.top,
      focused: false
    });

    console.log('Windows created:', { window1: window1.id, window2: window2.id });
    showSuccess('分屏浏览已启动！');

    // 关闭弹窗
    setTimeout(() => {
      window.close();
    }, 1000);

  } catch (error) {
    console.error('替代分屏方案失败:', error);
    showError('启动分屏失败: ' + error.message);
  }
}

// 计算窗口布局
function calculateWindowLayout(currentWindow, mode) {
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;
  const windowWidth = Math.min(currentWindow?.width || 800, screenWidth);
  const windowHeight = Math.min(currentWindow?.height || 600, screenHeight - 100);

  switch (mode) {
    case 'side-by-side':
      return {
        width: {
          width1: Math.floor(windowWidth / 2) - 10,
          width2: Math.floor(windowWidth / 2) - 10
        },
        height: windowHeight,
        left: {
          left1: Math.floor((screenWidth - windowWidth) / 2),
          left2: Math.floor((screenWidth - windowWidth) / 2) + Math.floor(windowWidth / 2) + 10
        },
        top: Math.floor((screenHeight - windowHeight) / 2)
      };

    case 'top-bottom':
      return {
        width: {
          width1: windowWidth,
          width2: windowWidth
        },
        height: windowHeight,
        left: {
          left1: Math.floor((screenWidth - windowWidth) / 2),
          left2: Math.floor((screenWidth - windowWidth) / 2)
        },
        top: {
          top1: Math.floor((screenHeight - windowHeight) / 2),
          top2: Math.floor((screenHeight - windowHeight) / 2) + Math.floor(windowHeight / 2) + 10
        }
      };

    case 'focus':
      return {
        width: {
          width1: Math.floor(windowWidth * 0.6),
          width2: Math.floor(windowWidth * 0.4) - 10
        },
        height: windowHeight,
        left: {
          left1: Math.floor((screenWidth - windowWidth) / 2),
          left2: Math.floor((screenWidth - windowWidth) / 2) + Math.floor(windowWidth * 0.6) + 10
        },
        top: Math.floor((screenHeight - windowHeight) / 2)
      };

    default:
      return calculateWindowLayout(currentWindow, 'side-by-side');
  }
}

// 应用模板
function applyTemplate(templateName) {
  const template = templates[templateName];
  if (!template) return;

  console.log('Applying template:', templateName);

  // 设置网站选择
  const website1Select = document.getElementById('website1');
  const website2Select = document.getElementById('website2');

  if (website1Select) {
    website1Select.value = template.websites[0];
  }

  if (website2Select) {
    website2Select.value = template.websites[1];
  }

  // 隐藏自定义输入框
  const customUrl1 = document.getElementById('custom-url1');
  const customUrl2 = document.getElementById('custom-url2');

  if (customUrl1) customUrl1.style.display = 'none';
  if (customUrl2) customUrl2.style.display = 'none';

  // 显示提示
  showSuccess(`已应用${template.name}`);
}

// 打开指南
function openGuide() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('guide.html')
  });
  window.close();
}

// 保存设置
function saveSetting(key, value) {
  chrome.storage.sync.set({ [key]: value });
}

// 加载设置
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'autoDetect', 'rememberLayout', 'lastLayout'
    ]);

    if (settings.autoDetect !== undefined) {
      const autoDetectCheckbox = document.getElementById('auto-detect');
      if (autoDetectCheckbox) autoDetectCheckbox.checked = settings.autoDetect;
    }

    if (settings.rememberLayout !== undefined) {
      const rememberLayoutCheckbox = document.getElementById('remember-layout');
      if (rememberLayoutCheckbox) rememberLayoutCheckbox.checked = settings.rememberLayout;
    }

  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

// 恢复上次设置
async function restoreLastSettings() {
  try {
    const settings = await chrome.storage.sync.get(['lastLayout']);

    if (settings.lastLayout && document.getElementById('remember-layout')?.checked) {
      const layout = settings.lastLayout;

      if (layout.website1) {
        const select1 = document.getElementById('website1');
        if (select1) {
          if (layout.website1.startsWith('http')) {
            select1.value = 'custom';
            const customUrl1 = document.getElementById('custom-url1');
            if (customUrl1) {
              customUrl1.value = layout.website1;
              customUrl1.style.display = 'block';
            }
          }
        }
      }

      if (layout.website2) {
        const select2 = document.getElementById('website2');
        if (select2) {
          if (layout.website2.startsWith('http')) {
            select2.value = 'custom';
            const customUrl2 = document.getElementById('custom-url2');
            if (customUrl2) {
              customUrl2.value = layout.website2;
              customUrl2.style.display = 'block';
            }
          }
        }
      }

      if (layout.mode) {
        document.querySelectorAll('.mode-btn').forEach(btn => {
          btn.classList.remove('active');
          if (btn.dataset.mode === layout.mode) {
            btn.classList.add('active');
            currentMode = layout.mode;
          }
        });
      }
    }
  } catch (error) {
    console.error('恢复上次设置失败:', error);
  }
}

// 保存当前布局
async function saveCurrentLayout(website1, website2, mode) {
  try {
    await chrome.storage.sync.set({
      lastLayout: {
        website1,
        website2,
        mode,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('保存布局失败:', error);
  }
}

// 显示成功消息
function showSuccess(message) {
  showToast(message, 'success');
}

// 显示错误消息
function showError(message) {
  showToast(message, 'error');
}

// 显示Toast消息
function showToast(message, type = 'info') {
  // 创建Toast元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  // 添加样式
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 16px',
    borderRadius: '6px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '10000',
    opacity: '0',
    transform: 'translateY(-20px)',
    transition: 'all 0.3s ease'
  });

  // 设置背景色
  switch (type) {
    case 'success':
      toast.style.background = '#28a745';
      break;
    case 'error':
      toast.style.background = '#dc3545';
      break;
    default:
      toast.style.background = '#6c757d';
  }

  // 添加到页面
  document.body.appendChild(toast);

  // 显示动画
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 100);

  // 自动隐藏
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// 添加调试信息
console.log('Popup script loaded successfully');