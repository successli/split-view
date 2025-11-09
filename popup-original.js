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
  await initializePopup();
  setupEventListeners();
  loadSettings();
});

// 初始化弹窗
async function initializePopup() {
  try {
    // 获取当前标签页
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];

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
    statusChecking.style.display = 'flex';
    statusEnabled.style.display = 'none';
    statusDisabled.style.display = 'none';

    // 检测Chrome版本和Split View支持
    const chromeInfo = await getChromeInfo();
    const hasSplitView = await detectSplitViewSupport();

    setTimeout(() => {
      statusChecking.style.display = 'none';

      if (hasSplitView) {
        statusEnabled.style.display = 'flex';
        statusDisabled.style.display = 'none';
        splitViewEnabled = true;
      } else {
        statusEnabled.style.display = 'none';
        statusDisabled.style.display = 'flex';
        splitViewEnabled = false;
      }
    }, 1500);

  } catch (error) {
    console.error('检测Split View状态失败:', error);
    statusChecking.style.display = 'none';
    statusDisabled.style.display = 'flex';
    splitViewEnabled = false;
  }
}

// 获取Chrome信息
async function getChromeInfo() {
  return new Promise((resolve) => {
    chrome.runtime.getPlatformInfo((info) => {
      resolve(info);
    });
  });
}

// 检测Split View支持
async function detectSplitViewSupport() {
  try {
    // 尝试检测Chrome实验性功能
    // 由于split-view没有直接API，我们通过其他方式间接检测
    const version = navigator.userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = version ? parseInt(version[1]) : 0;

    // Chrome 111+ 版本可能支持split-view
    return chromeVersion >= 111;
  } catch (error) {
    console.error('检测Split View支持失败:', error);
    return false;
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 网站选择变化
  document.getElementById('website1').addEventListener('change', (e) => {
    handleWebsiteSelect(e.target, 'custom-url1');
  });

  document.getElementById('website2').addEventListener('change', (e) => {
    handleWebsiteSelect(e.target, 'custom-url2');
  });

  // 分屏模式切换
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
    });
  });

  // 操作按钮
  document.getElementById('btn-split').addEventListener('click', startSplitView);
  document.getElementById('btn-alternative').addEventListener('click', startAlternativeSplit);
  document.getElementById('btn-guide').addEventListener('click', openGuide);

  // 模板按钮
  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTemplate(btn.dataset.template);
    });
  });

  // 设置选项
  document.getElementById('auto-detect').addEventListener('change', (e) => {
    saveSetting('autoDetect', e.target.checked);
  });

  document.getElementById('remember-layout').addEventListener('change', (e) => {
    saveSetting('rememberLayout', e.target.checked);
  });
}

// 处理网站选择
function handleWebsiteSelect(selectElement, customUrlInputId) {
  const customUrlInput = document.getElementById(customUrlInputId);

  if (selectElement.value === 'custom') {
    customUrlInput.style.display = 'block';
    customUrlInput.focus();
  } else {
    customUrlInput.style.display = 'none';
    customUrlInput.value = '';
  }
}

// 开始分屏浏览
async function startSplitView() {
  try {
    const website1 = getWebsiteUrl('website1', 'custom-url1');
    const website2 = getWebsiteUrl('website2', 'custom-url2');

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
    if (document.getElementById('remember-layout').checked) {
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

  if (select.value === 'current' && currentTab) {
    return currentTab.url;
  } else if (select.value === 'custom') {
    return customInput.value.trim();
  } else {
    return select.value;
  }
}

// 原生Split View（占位符实现）
async function nativeSplitView(url1, url2) {
  // 目前Chrome没有公开的Split View API
  // 这里作为未来可能的API预留
  console.log('原生Split View暂不可用，使用替代方案');
  await startAlternativeSplit();
}

// 替代分屏方案
async function startAlternativeSplit() {
  try {
    const website1 = getWebsiteUrl('website1', 'custom-url1');
    const website2 = getWebsiteUrl('website2', 'custom-url2');

    // 发送消息给background script处理分屏
    const response = await sendMessageToBackground({
      action: 'createAlternativeSplit',
      data: {
        website1,
        website2,
        mode: currentMode
      }
    });

    if (response.success) {
      showSuccess('分屏浏览已启动！');

      // 关闭弹窗
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      showError('启动分屏失败: ' + response.error);
    }

  } catch (error) {
    console.error('替代分屏方案失败:', error);
    showError('启动分屏失败: ' + error.message);
  }
}

// 发送消息给background script
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// 计算窗口布局
function calculateWindowLayout(currentWindow, mode) {
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;
  const windowWidth = Math.min(currentWindow.width, screenWidth);
  const windowHeight = Math.min(currentWindow.height, screenHeight - 100);

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
        height: {
          height1: Math.floor(windowHeight / 2) - 10,
          height2: Math.floor(windowHeight / 2) - 10
        },
        left: Math.floor((screenWidth - windowWidth) / 2),
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

  // 设置网站选择
  document.getElementById('website1').value = template.websites[0];
  document.getElementById('website2').value = template.websites[1];

  // 隐藏自定义输入框
  document.getElementById('custom-url1').style.display = 'none';
  document.getElementById('custom-url2').style.display = 'none';

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
      document.getElementById('auto-detect').checked = settings.autoDetect;
    }

    if (settings.rememberLayout !== undefined) {
      document.getElementById('remember-layout').checked = settings.rememberLayout;
    }

  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

// 恢复上次设置
async function restoreLastSettings() {
  try {
    const settings = await chrome.storage.sync.get(['lastLayout']);

    if (settings.lastLayout && document.getElementById('remember-layout').checked) {
      const layout = settings.lastLayout;

      if (layout.website1) {
        // 设置第一个网站
        const select1 = document.getElementById('website1');
        if (layout.website1.startsWith('http')) {
          select1.value = 'custom';
          document.getElementById('custom-url1').value = layout.website1;
          document.getElementById('custom-url1').style.display = 'block';
        }
      }

      if (layout.website2) {
        // 设置第二个网站
        const select2 = document.getElementById('website2');
        if (layout.website2.startsWith('http')) {
          select2.value = 'custom';
          document.getElementById('custom-url2').value = layout.website2;
          document.getElementById('custom-url2').style.display = 'block';
        }
      }

      if (layout.mode) {
        // 设置分屏模式
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
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}