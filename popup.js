// 简化版popup.js
// 支持一键分屏和自定义功能

// 全局变量
let splitViewEnabled = true;
let currentTab = null;
let presetCounter = 4; // 当前预设计数器，用于生成新预设ID
let currentEditingPreset = null; // 当前正在编辑的预设ID

// 网站图标映射
const websiteIcons = {
  'deepseek.com': '🧠',
  'kimi.moonshot.cn': '🌙',
  'claude.ai': '🤖',
  'chat.openai.com': '💬',
  'github.com': '💻',
  'google.com': '🔍',
  'wikipedia.org': '🌍',
  'bilibili.com': '📺',
  'zhihu.com': '❓',
  'baidu.com': '🔍',
  'youtube.com': '📺',
  'twitter.com': '🐦',
  'facebook.com': '📘',
  'linkedin.com': '💼',
  'reddit.com': '🤖',
  'stackoverflow.com': '💻',
  'medium.com': '📝',
  'notion.so': '📋',
  'figma.com': '🎨',
  'dribbble.com': '🏀',
  'behance.net': '🎨'
};

// 网站名称映射
const websiteNames = {
  'deepseek.com': 'DeepSeek',
  'kimi.moonshot.cn': 'Kimi',
  'claude.ai': 'Claude',
  'chat.openai.com': 'ChatGPT',
  'github.com': 'GitHub',
  'google.com': 'Google',
  'wikipedia.org': 'Wikipedia',
  'bilibili.com': 'Bilibili',
  'zhihu.com': '知乎',
  'baidu.com': '百度',
  'youtube.com': 'YouTube',
  'twitter.com': 'Twitter',
  'facebook.com': 'Facebook',
  'linkedin.com': 'LinkedIn',
  'reddit.com': 'Reddit',
  'stackoverflow.com': 'Stack Overflow',
  'medium.com': 'Medium',
  'notion.so': 'Notion',
  'figma.com': 'Figma',
  'dribbble.com': 'Dribbble',
  'behance.net': 'Behance'
};

// 获取网站图标的函数
function getWebsiteIcon(url) {
  try {
    // 标准化URL以支持没有协议前缀的输入
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const domain = new URL(normalizedUrl).hostname.toLowerCase();

    // 查找匹配的图标
    for (const [site, icon] of Object.entries(websiteIcons)) {
      if (domain.includes(site)) {
        return icon;
      }
    }

    // 默认图标
    return '🌐';
  } catch (error) {
    return '🌐';
  }
}

// 获取网站名称的函数
function getWebsiteName(url) {
  try {
    // 标准化URL以支持没有协议前缀的输入
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const domain = new URL(normalizedUrl).hostname.toLowerCase();

    // 查找匹配的名称
    for (const [site, name] of Object.entries(websiteNames)) {
      if (domain.includes(site)) {
        return name;
      }
    }

    // 如果没有匹配项，返回域名
    return domain.replace('www.', '');
  } catch (error) {
    return '未知网站';
  }
}

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup DOM loaded, initializing...');
  try {
    await initializePopup();
    await loadCustomPresets(); // 加载保存的自定义组合
    setupEventListeners();
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

    // 显示版本号
    try {
      const manifest = chrome.runtime.getManifest();
      const versionElement = document.getElementById('versionNumber');
      if (versionElement) {
        versionElement.textContent = manifest.version;
      }
      console.log('Extension version:', manifest.version);
    } catch (error) {
      console.warn('Failed to get version:', error);
    }

    // 获取当前标签页
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tabs[0];
      console.log('Current tab:', currentTab?.url);
    } catch (error) {
      console.warn('Failed to get current tab:', error);
      currentTab = null;
    }

    // 直接启用分屏功能
    splitViewEnabled = true;

  } catch (error) {
    console.error('初始化失败:', error);
    showError('初始化失败，请重试');
  }
}


// 设置事件监听器
function setupEventListeners() {
  console.log('Setting up event listeners...');

  // 分屏按钮点击事件 - 一键分屏
  document.querySelectorAll('.split-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // 阻止事件冒泡

      const presetItem = btn.closest('.preset-item');
      const leftInput = presetItem.querySelector('[data-side="left"]');
      const rightInput = presetItem.querySelector('[data-side="right"]');

      const website1 = leftInput.value.trim();
      const website2 = rightInput.value.trim();

      console.log('Split button clicked:', website1, '+', website2);

      // 验证URL格式
      if (!website1 || !website2) {
        showError('请填写完整的网址');
        return;
      }

      if (!isValidUrl(website1) || !isValidUrl(website2)) {
        showError('请输入有效的网址');
        return;
      }

      // 更新按钮数据属性（保存原始输入，不标准化）
      btn.dataset.left = website1;
      btn.dataset.right = website2;

      // 禁用按钮，防止重复点击
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-icon">⏳</span>分屏中...';

      try {
        // 直接开始左右分屏
        await startSplitScreen(website1, website2);
      } catch (error) {
        console.error('分屏启动失败:', error);
        showError('启动分屏失败: ' + error.message);

        // 恢复按钮状态
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">🚀</span>分屏';
      }
    });
  });

  // 网址输入框事件监听
  document.querySelectorAll('.url-input').forEach(input => {
    // 输入时更新图标和名称
    input.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const presetItem = e.target.closest('.preset-item');
      const websiteContainer = e.target.parentElement;
      const iconElement = websiteContainer.querySelector('.site-icon');
      const nameElement = websiteContainer.querySelector('.website-name');

      if (url && iconElement && iconElement.classList.contains('site-icon')) {
        const newIcon = getWebsiteIcon(url);
        iconElement.textContent = newIcon;
      }

      if (url && nameElement) {
        const newName = getWebsiteName(url);
        nameElement.textContent = newName;
      }

      // 更新对应的分屏按钮数据（保存原始输入）
      const splitBtn = presetItem.querySelector('.split-btn');
      if (splitBtn) {
        const side = e.target.dataset.side;
        const otherSide = side === 'left' ? 'right' : 'left';
        const otherInput = presetItem.querySelector(`[data-side="${otherSide}"]`);

        if (side === 'left') {
          splitBtn.dataset.left = url;
        } else {
          splitBtn.dataset.right = url;
        }
      }

      // 如果是自定义组合，实时保存变化
      const presetId = presetItem.getAttribute('data-preset-id');
      if (presetId && presetId.startsWith('custom-')) {
        // 使用防抖函数，避免频繁保存
        clearTimeout(window.saveTimeout);
        window.saveTimeout = setTimeout(() => {
          saveCustomPresets();
        }, 1000);
      }
    });

    // 焦点事件
    input.addEventListener('focus', (e) => {
      e.target.select();
    });
  });

  // 添加自定义组合按钮
  const addPresetBtn = document.getElementById('addPresetBtn');
  if (addPresetBtn) {
    addPresetBtn.addEventListener('click', () => {
      addCustomPreset();
    });
  }

  // 编辑按钮事件监听器
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const presetId = btn.getAttribute('data-preset-id');
      toggleEditMode(presetId);
    });
  });

  // 删除按钮事件监听器
  document.querySelectorAll('.delete-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const presetId = btn.getAttribute('data-preset-id');
      deletePreset(presetId);
    });
  });

  // 重置按钮事件监听器
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', showResetConfirmDialog);
  }

  // 重置确认对话框事件监听器
  const cancelResetBtn = document.getElementById('cancelReset');
  const confirmResetBtn = document.getElementById('confirmReset');

  if (cancelResetBtn) {
    cancelResetBtn.addEventListener('click', hideResetConfirmDialog);
  }

  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', confirmReset);
  }

  console.log('Event listeners setup complete');
}



// 添加自定义预设组合
function addCustomPreset() {
  presetCounter++;
  const presetId = `custom-${presetCounter}`;

  const presetHTML = `
    <div class="preset-item" data-preset-id="${presetId}">
      <div class="preset-controls">
        <button class="edit-btn" data-preset-id="${presetId}">
          <span class="edit-icon">✏️</span>
        </button>
      </div>
      <div class="preset-info">
        <div class="website-left">
          <span class="site-icon">🌐</span>
          <div class="website-name">请添加网址</div>
          <input type="text" class="url-input" placeholder="左侧网址" data-side="left" value="" readonly>
        </div>
        <div class="divider">
          <span class="divider-icon">+</span>
        </div>
        <div class="website-right">
          <span class="site-icon">🌐</span>
          <div class="website-name">请添加网址</div>
          <input type="text" class="url-input" placeholder="右侧网址" data-side="right" value="" readonly>
        </div>
      </div>
      <button class="split-btn" data-left="" data-right="">
        <span class="btn-icon">🚀</span>
        分屏
      </button>
      <button class="delete-preset-btn" data-preset-id="${presetId}" title="删除此预设">
        <span class="delete-icon">✕</span>
      </button>
    </div>
  `;

  const presetList = document.getElementById('presetList');
  presetList.insertAdjacentHTML('beforeend', presetHTML);

  // 为新添加的预设绑定事件监听器
  const newPreset = presetList.lastElementChild;
  bindPresetEvents(newPreset);

  // 自动进入编辑模式并聚焦到左侧输入框
  setTimeout(() => {
    enterEditMode(presetId);
  }, 100);

  console.log('Added custom preset:', presetId);
}

// 删除预设组合
async function deletePreset(presetId) {
  const preset = document.querySelector(`[data-preset-id="${presetId}"]`);
  if (preset) {
    // 如果当前正在编辑这个预设，先退出编辑模式
    if (currentEditingPreset === presetId) {
      currentEditingPreset = null;
    }

    preset.remove();
    console.log('Deleted preset:', presetId);

    // 如果是自定义组合，更新存储
    if (presetId.startsWith('custom-')) {
      await saveCustomPresets();
    }
  }
}

// 为预设元素绑定事件
function bindPresetEvents(presetElement) {
  // 分屏按钮事件
  const splitBtn = presetElement.querySelector('.split-btn');
  if (!splitBtn) {
    console.error('Split button not found in preset element');
    return;
  }

  splitBtn.addEventListener('click', async (e) => {
    e.stopPropagation();

    const leftInput = presetElement.querySelector('[data-side="left"]');
    const rightInput = presetElement.querySelector('[data-side="right"]');

    // 验证输入框存在
    if (!leftInput || !rightInput) {
      showError('预设配置不完整');
      return;
    }

    const website1 = leftInput.value.trim();
    const website2 = rightInput.value.trim();

    console.log('Split button clicked:', website1, '+', website2);

    // 验证URL格式
    if (!website1 || !website2) {
      showError('请填写完整的网址');
      return;
    }

    if (!isValidUrl(website1) || !isValidUrl(website2)) {
      showError('请输入有效的网址');
      return;
    }

    // 更新按钮数据属性
    splitBtn.dataset.left = website1;
    splitBtn.dataset.right = website2;

    // 禁用按钮，防止重复点击
    splitBtn.disabled = true;
    splitBtn.innerHTML = '<span class="btn-icon">⏳</span>分屏中...';

    try {
      // 直接开始左右分屏
      await startSplitScreen(website1, website2);
    } catch (error) {
      console.error('分屏启动失败:', error);
      showError('启动分屏失败: ' + error.message);

      // 恢复按钮状态
      splitBtn.disabled = false;
      splitBtn.innerHTML = '<span class="btn-icon">🚀</span>分屏';
    }
  });

  // 编辑按钮事件
  const editBtn = presetElement.querySelector('.edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const presetId = editBtn.getAttribute('data-preset-id');
      toggleEditMode(presetId);
    });
  }

  // 删除按钮事件
  const deleteBtn = presetElement.querySelector('.delete-preset-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const presetId = deleteBtn.getAttribute('data-preset-id');
      await deletePreset(presetId);
    });
  }

  // 网址输入框事件
  presetElement.querySelectorAll('.url-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const websiteContainer = e.target.parentElement;
      const iconElement = websiteContainer.querySelector('.site-icon');
      const nameElement = websiteContainer.querySelector('.website-name');

      if (url && iconElement && iconElement.classList.contains('site-icon')) {
        const newIcon = getWebsiteIcon(url);
        iconElement.textContent = newIcon;
      }

      if (url && nameElement) {
        const newName = getWebsiteName(url);
        nameElement.textContent = newName;
      }

      // 更新分屏按钮数据（保存原始输入）
      const side = e.target.dataset.side;
      if (side === 'left') {
        splitBtn.dataset.left = url;
      } else {
        splitBtn.dataset.right = url;
      }

      // 如果是自定义组合，实时保存变化
      const presetId = presetElement.getAttribute('data-preset-id');
      if (presetId && presetId.startsWith('custom-')) {
        // 使用防抖函数，避免频繁保存
        clearTimeout(window.saveTimeout);
        window.saveTimeout = setTimeout(() => {
          saveCustomPresets();
        }, 1000);
      }
    });

    input.addEventListener('focus', (e) => {
      e.target.select();
    });
  });
}

// 验证URL格式
function isValidUrl(string) {
  try {
    // 如果是chrome://或类似协议，返回true
    if (string.startsWith('chrome://') || string.startsWith('about:')) {
      return true;
    }

    // 尝试直接验证URL
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    // 如果直接验证失败，尝试添加协议前缀
    try {
      // 如果没有协议，尝试添加https://
      let urlString = string.trim();
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'https://' + urlString;
      }

      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }
}



// 标准化URL（确保有协议前缀）
function normalizeUrl(url) {
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

// 左右分屏功能
async function startSplitScreen(website1, website2) {
  console.log('Starting split screen with:', { website1, website2 });
  try {
    // 标准化URL
    const url1 = normalizeUrl(website1);
    const url2 = normalizeUrl(website2);

    console.log('Normalized URLs:', { url1, url2 });

    // 获取屏幕尺寸
    const screenWidth = window.screen.availWidth || 1920;
    const screenHeight = window.screen.availHeight || 1080;

    console.log('Using screen dimensions:', { screenWidth, screenHeight });

    // 计算左右分屏布局
    const windowGap = 2; // 窗口间隙
    const windowWidth = Math.floor(screenWidth / 2) - Math.floor(windowGap / 2);
    const windowHeight = screenHeight;

    console.log('Window layout:', {
      leftWindow: { width: windowWidth, height: windowHeight, left: 0, top: 0 },
      rightWindow: { width: windowWidth, height: windowHeight, left: windowWidth + windowGap, top: 0 }
    });

    // 创建左侧窗口
    const window1 = await chrome.windows.create({
      url: url1,
      width: windowWidth,
      height: windowHeight,
      left: 0,
      top: 0,
      focused: true,
      state: 'normal'
    });

    // 创建右侧窗口
    setTimeout(async () => {
      try {
        const window2 = await chrome.windows.create({
          url: url2,
          width: windowWidth,
          height: windowHeight,
          left: windowWidth + windowGap,
          top: 0,
          focused: false,
          state: 'normal'
        });

        console.log('Both windows created successfully:', {
          window1: window1.id,
          window2: window2.id
        });
        showSuccess('分屏已启动！');

        // 关闭弹窗
        setTimeout(() => {
          window.close();
        }, 800);

      } catch (error2) {
        console.error('Failed to create second window:', error2);
        showError('右侧窗口创建失败: ' + error2.message);
      }
    }, 500);

  } catch (error) {
    console.error('分屏启动失败:', error);
    showError('启动分屏失败: ' + error.message);
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

// 切换编辑模式
function toggleEditMode(presetId) {
  const preset = document.querySelector(`[data-preset-id="${presetId}"]`);
  const editBtn = preset.querySelector('.edit-btn');
  const inputs = preset.querySelectorAll('.url-input');

  // 如果当前有其他预设正在编辑，先关闭编辑
  if (currentEditingPreset && currentEditingPreset !== presetId) {
    exitEditMode(currentEditingPreset);
  }

  if (currentEditingPreset === presetId) {
    // 退出编辑模式
    exitEditMode(presetId);
  } else {
    // 进入编辑模式
    enterEditMode(presetId);
  }
}

// 进入编辑模式
function enterEditMode(presetId) {
  const preset = document.querySelector(`[data-preset-id="${presetId}"]`);
  const editBtn = preset.querySelector('.edit-btn');
  const inputs = preset.querySelectorAll('.url-input');

  // 添加编辑状态样式
  preset.classList.add('editing');
  editBtn.classList.add('editing');
  editBtn.innerHTML = '<span class="edit-icon">✓</span>';

  // 移除只读属性
  inputs.forEach(input => {
    input.removeAttribute('readonly');
  });

  // 自动聚焦到第一个输入框
  inputs[0].focus();
  inputs[0].select();

  currentEditingPreset = presetId;
  console.log('进入编辑模式:', presetId);
}

// 退出编辑模式
function exitEditMode(presetId) {
  const preset = document.querySelector(`[data-preset-id="${presetId}"]`);
  const editBtn = preset.querySelector('.edit-btn');
  const inputs = preset.querySelectorAll('.url-input');
  const splitBtn = preset.querySelector('.split-btn');

  // 移除编辑状态样式
  preset.classList.remove('editing');
  editBtn.classList.remove('editing');
  editBtn.innerHTML = '<span class="edit-icon">✏️</span>';

  // 添加只读属性
  inputs.forEach(input => {
    input.setAttribute('readonly', true);
  });

  // 更新分屏按钮的数据属性（保存原始输入）
  const leftInput = preset.querySelector('[data-side="left"]');
  const rightInput = preset.querySelector('[data-side="right"]');

  splitBtn.dataset.left = leftInput.value.trim();
  splitBtn.dataset.right = rightInput.value.trim();

  // 如果是自定义组合，保存到存储中
  if (presetId.startsWith('custom-')) {
    saveCustomPresets();
  }

  currentEditingPreset = null;
  console.log('退出编辑模式:', presetId);
}

// 保存自定义组合到存储
async function saveCustomPresets() {
  try {
    const customPresets = [];
    const customElements = document.querySelectorAll('[data-preset-id^="custom-"]');

    customElements.forEach(element => {
      const presetId = element.getAttribute('data-preset-id');
      const leftInput = element.querySelector('[data-side="left"]');
      const rightInput = element.querySelector('[data-side="right"]');
      const leftIcon = element.querySelector('.website-left .site-icon');
      const rightIcon = element.querySelector('.website-right .site-icon');
      const leftName = element.querySelector('.website-left .website-name');
      const rightName = element.querySelector('.website-right .website-name');

      // 验证所有必需的DOM元素都存在
      if (!leftInput || !rightInput || !leftIcon || !rightIcon || !leftName || !rightName) {
        console.warn('跳过不完整的预设:', presetId, {
          leftInput: !!leftInput,
          rightInput: !!rightInput,
          leftIcon: !!leftIcon,
          rightIcon: !!rightIcon,
          leftName: !!leftName,
          rightName: !!rightName
        });
        return; // 跳过这个不完整的预设
      }

      // 验证URL存在且不为空
      const leftUrl = leftInput.value.trim();
      const rightUrl = rightInput.value.trim();

      if (!leftUrl || !rightUrl) {
        console.warn('跳过空URL的预设:', presetId, { leftUrl, rightUrl });
        return; // 跳过这个没有URL的预设
      }

      customPresets.push({
        id: presetId,
        leftUrl: leftUrl,
        rightUrl: rightUrl,
        leftIcon: leftIcon.textContent,
        rightIcon: rightIcon.textContent,
        leftName: leftName.textContent,
        rightName: rightName.textContent
      });
    });

    await chrome.storage.local.set({
      customPresets: customPresets,
      lastSaved: Date.now()
    });

    console.log('已保存自定义组合:', customPresets);
  } catch (error) {
    console.error('保存自定义组合失败:', error);
  }
}

// 从存储加载自定义组合
async function loadCustomPresets() {
  try {
    const result = await chrome.storage.local.get(['customPresets']);
    const customPresets = result.customPresets || [];

    console.log('加载自定义组合:', customPresets);

    const presetList = document.getElementById('presetList');

    customPresets.forEach(preset => {
      const presetHTML = `
        <div class="preset-item" data-preset-id="${preset.id}">
          <div class="preset-controls">
            <button class="edit-btn" data-preset-id="${preset.id}">
              <span class="edit-icon">✏️</span>
            </button>
          </div>
          <div class="preset-info">
            <div class="website-left">
              <span class="site-icon">${preset.leftIcon}</span>
              <div class="website-name">${preset.leftName}</div>
              <input type="text" class="url-input" value="${preset.leftUrl}" placeholder="左侧网址" data-side="left" readonly>
            </div>
            <div class="divider">
              <span class="divider-icon">+</span>
            </div>
            <div class="website-right">
              <span class="site-icon">${preset.rightIcon}</span>
              <div class="website-name">${preset.rightName}</div>
              <input type="text" class="url-input" value="${preset.rightUrl}" placeholder="右侧网址" data-side="right" readonly>
            </div>
          </div>
          <button class="split-btn" data-left="${preset.leftUrl}" data-right="${preset.rightUrl}">
            <span class="btn-icon">🚀</span>
            分屏
          </button>
          <button class="delete-preset-btn" data-preset-id="${preset.id}" title="删除此预设">
            <span class="delete-icon">✕</span>
          </button>
        </div>
      `;

      presetList.insertAdjacentHTML('beforeend', presetHTML);
      const newPreset = presetList.lastElementChild;
      bindPresetEvents(newPreset);
    });

    // 更新预设计数器，避免ID冲突
    const maxCustomId = customPresets.reduce((max, preset) => {
      const idNum = parseInt(preset.id.replace('custom-', ''));
      return Math.max(max, idNum);
    }, 4);
    presetCounter = maxCustomId;

  } catch (error) {
    console.error('加载自定义组合失败:', error);
  }
}

// 添加键盘事件支持
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && currentEditingPreset) {
    // 在编辑模式下按Enter键保存并退出编辑
    e.preventDefault();
    exitEditMode(currentEditingPreset);
  } else if (e.key === 'Escape' && currentEditingPreset) {
    // 在编辑模式下按Esc键取消编辑
    e.preventDefault();
    exitEditMode(currentEditingPreset);
  }
});

// 删除预设功能
async function deletePreset(presetId) {
  try {
    console.log('Deleting preset:', presetId);

    // 检查是否为内置预设（ID 1-4为内置预设，不可删除）
    const numericId = parseInt(presetId);
    if (numericId >= 1 && numericId <= 4) {
      showError('内置预设不可删除');
      return;
    }

    // 确认删除
    if (!confirm('确定要删除这个预设组合吗？')) {
      return;
    }

    // 从DOM中移除预设
    const presetElement = document.querySelector(`[data-preset-id="${presetId}"]`);
    if (presetElement) {
      presetElement.remove();
      showSuccess('预设已删除');
    }

    // 从存储中删除
    try {
      const result = await chrome.storage.local.get(['customPresets']);
      let customPresets = result.customPresets || [];
      customPresets = customPresets.filter(preset => preset.id !== presetId);
      await chrome.storage.local.set({ customPresets });
      console.log('Preset removed from storage:', presetId);
    } catch (error) {
      console.error('Failed to remove preset from storage:', error);
    }

  } catch (error) {
    console.error('删除预设失败:', error);
    showError('删除失败: ' + error.message);
  }
}

// 显示重置确认对话框
function showResetConfirmDialog() {
  const dialog = document.getElementById('resetConfirmDialog');
  if (dialog) {
    dialog.classList.add('show');
    console.log('Reset confirm dialog shown');
  }
}

// 隐藏重置确认对话框
function hideResetConfirmDialog() {
  const dialog = document.getElementById('resetConfirmDialog');
  if (dialog) {
    dialog.classList.remove('show');
    console.log('Reset confirm dialog hidden');
  }
}

// 确认重置
async function confirmReset() {
  try {
    console.log('Resetting all settings...');

    // 禁用重置按钮，防止重复操作
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.disabled = true;
      resetBtn.innerHTML = '<span class="reset-icon">⏳</span>重置中...';
    }

    // 清除所有存储数据
    await chrome.storage.local.clear();
    console.log('All storage cleared');

    // 隐藏对话框
    hideResetConfirmDialog();

    // 重新加载页面以恢复初始状态
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    showSuccess('重置成功！页面即将刷新...');

  } catch (error) {
    console.error('重置失败:', error);
    showError('重置失败: ' + error.message);

    // 恢复重置按钮状态
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.disabled = false;
      resetBtn.innerHTML = '<span class="reset-icon">🔄</span>重置';
    }
  }
}

// 点击对话框背景关闭
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('confirm-dialog')) {
    hideResetConfirmDialog();
  }
});

// ESC键关闭对话框
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideResetConfirmDialog();
  }
});

// 添加调试信息
console.log('Popup script loaded successfully');