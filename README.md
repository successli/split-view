# Split View Chrome Extension

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange.svg)](manifest.json)

🖥️ 一个智能的Chrome分屏浏览助手，自动引导用户启用Chrome实验性Split View功能，提供便捷的分屏浏览体验。

## ✨ 功能特点

### 🚀 核心功能
- **智能检测** - 自动检测Chrome Split View实验性功能是否启用
- **一键分屏** - 快速启动两个网页的分屏浏览
- **预设模板** - 提供工作、学习、AI对话、娱乐等常用模板
- **多种布局** - 支持左右分屏、上下分屏、专注模式

### 🎯 用户体验
- **直观界面** - 现代化的用户界面设计
- **智能引导** - 详细的Split View启用指南
- **设置保存** - 记住用户的分屏偏好设置
- **URL验证** - 智能验证输入的网址格式

### 🔧 技术特性
- **Manifest V3** - 使用最新的Chrome Extension API
- **Window Management** - 智能窗口管理和布局优化
- **跨平台兼容** - 支持Windows、macOS、Linux
- **响应式设计** - 适配不同屏幕尺寸

## 📦 安装方法

### 方法一：开发者模式安装（推荐）

1. **克隆或下载项目**
   ```bash
   git clone https://github.com/your-username/split-view-chrome-extension.git
   cd split-view-chrome-extension
   ```

2. **打开Chrome扩展管理页面**
   - 在Chrome地址栏输入 `chrome://extensions/`
   - 或通过菜单：更多工具 → 扩展程序

3. **启用开发者模式**
   - 点击页面右上角的"开发者模式"开关

4. **加载扩展**
   - 点击"加载已解压的扩展程序"
   - 选择项目文件夹 `split-view-chrome-extension`

5. **完成安装**
   - 扩展图标会出现在Chrome工具栏中

### 方法二：Chrome Web Store安装
> 暂未发布到Chrome Web Store，敬请期待

## 🚀 使用指南

### 首次使用

1. **打开扩展** - 点击Chrome工具栏中的Split View图标
2. **选择网站** - 选择要分屏浏览的两个网站
3. **开始分屏** - 点击"开始分屏浏览"按钮

### 启用Chrome Split View实验性功能

1. **打开实验性功能页面**
   ```
   chrome://flags/#split-view
   ```

2. **找到Split View选项**
   - 在搜索框中输入 `split-view`
   - 找到"Tab Scrolling"或类似选项

3. **启用功能**
   - 将下拉菜单从"Default"改为"Enabled"
   - 点击"Relaunch"按钮重启Chrome

### 使用分屏功能

1. **选择网站**
   - 从预设列表中选择或输入自定义网址
   - 支持"当前页面"选项

2. **选择布局模式**
   - **左右分屏** - 两个窗口并排显示
   - **上下分屏** - 两个窗口垂直排列
   - **专注模式** - 主窗口较大，副窗口较小

3. **开始分屏**
   - 点击"开始分屏浏览"按钮
   - 系统会自动创建两个优化布局的窗口

### 快速模板

- **💼 工作模式** - GitHub + 文档工具
- **📚 学习模式** - 搜索引擎 + 学习资料
- **🤖 AI对话** - ChatGPT + Claude
- **🎮 娱乐模式** - 视频网站 + 社交媒体

## 🔧 配置选项

### 扩展设置
- **记住上次布局设置** - 保存用户的分屏偏好

### 高级配置
扩展会自动保存以下设置：
- 最后使用的网站组合
- 首选的布局模式
- 窗口位置和大小偏好

## 🛠️ 开发说明

### 项目结构
```
split-view/
├── manifest.json          # 扩展配置文件
├── popup.html             # 扩展弹窗界面
├── popup.css              # 弹窗样式文件
├── popup.js               # 弹窗交互逻辑
├── background.js          # 后台服务脚本
├── guide.html             # Split View启用指南
├── icons/                 # 扩展图标文件
│   ├── README.md          # 图标制作说明
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # 项目说明文档
```

### 技术栈
- **前端** - HTML5, CSS3, JavaScript (ES6+)
- **API** - Chrome Extension API v3
- **存储** - Chrome Storage API
- **窗口管理** - Chrome Windows API

### 核心功能实现

#### 1. Split View检测
```javascript
// 检测Chrome版本和平台支持
async function detectSplitViewSupport() {
  const userAgent = navigator.userAgent;
  const chromeVersion = userAgent.match(/Chrome\/(\d+)/);
  const version = chromeVersion ? parseInt(chromeVersion[1]) : 0;

  return {
    hasNativeSupport: version >= 111,
    chromeVersion: version,
    platform: platformInfo.os
  };
}
```

#### 2. 窗口布局计算
```javascript
// 计算最优窗口布局
function calculateOptimalLayout(screenInfo, currentWindow, mode) {
  const { availWidth, availHeight } = screenInfo;

  switch (mode) {
    case 'side-by-side':
      return {
        width1: Math.floor(availWidth / 2) - 10,
        width2: Math.floor(availWidth / 2) - 10,
        // ... 更多布局参数
      };
  }
}
```

#### 3. 消息传递
```javascript
// Popup与Background通信
chrome.runtime.sendMessage({
  action: 'createAlternativeSplit',
  data: { website1, website2, mode }
}, (response) => {
  if (response.success) {
    showSuccess('分屏浏览已启动！');
  }
});
```

## 🔍 故障排除

### 常见问题

#### 1. 扩展无法加载
- **原因**：manifest.json格式错误或权限不足
- **解决**：检查JSON格式，确保文件路径正确

#### 2. Split View功能无法启用
- **原因**：Chrome版本过低或实验性功能已移除
- **解决**：更新Chrome到最新版本，使用替代方案

#### 3. 分屏窗口位置不正确
- **原因**：屏幕分辨率检测错误
- **解决**：手动调整窗口位置，或重启扩展

#### 4. 自定义网址无法打开
- **原因**：URL格式不正确或网站无法访问
- **解决**：检查网址格式，确保包含协议（http://或https://）

### 调试方法

1. **查看扩展日志**
   ```javascript
   // 在popup.js或background.js中添加
   console.log('Debug info:', data);
   ```

2. **检查Chrome DevTools**
   - 右键点击扩展图标 → "检查弹出内容"
   - 查看Console和Network面板

3. **验证权限**
   - 确保manifest.json包含所需权限
   - 检查Chrome扩展管理页面的权限设置

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发环境设置

1. **Fork项目**
   ```bash
   git clone https://github.com/your-username/split-view-chrome-extension.git
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **进行开发**
   - 修改代码
   - 测试功能
   - 更新文档

4. **提交更改**
   ```bash
   git commit -m "Add your feature description"
   git push origin feature/your-feature-name
   ```

5. **创建Pull Request**

### 代码规范
- 使用ES6+语法
- 遵循Google JavaScript代码规范
- 添加适当的注释和文档

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 🙏 致谢

- [Chrome Extension API文档](https://developer.chrome.com/docs/extensions/)
- [Material Design图标](https://fonts.google.com/icons)
- 所有贡献者和用户的支持

## 📞 联系方式

- **项目主页**：https://github.com/your-username/split-view-chrome-extension
- **问题反馈**：https://github.com/your-username/split-view-chrome-extension/issues
- **邮箱**：your-email@example.com

---

⭐ 如果这个项目对您有帮助，请给它一个星标！

---

**免责声明**：本扩展是开源项目，仅供学习和个人使用。Chrome Split View是Google的实验性功能，可能会在未来版本中发生变化。使用前请备份重要数据。