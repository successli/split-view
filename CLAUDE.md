# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个Chrome浏览器扩展程序，名为"Split View"，用于提供分屏浏览功能。扩展采用窗口管理方案实现分屏，支持预设组合和自定义功能。

## 核心架构

### 扩展结构
- **Manifest V3** - 使用最新的Chrome扩展API规范
- **Service Worker** - background.js作为后台服务脚本
- **弹出界面** - popup.html/popup.js/popup.css提供用户交互界面

### 主要组件
1. **popup.js** (1008行) - 前端逻辑，处理用户界面交互、预设管理和分屏请求
2. **background.js** (224行) - 后台服务，处理窗口创建和消息传递
3. **popup.html** - 扩展弹窗的HTML结构，包含预设列表和编辑界面
4. **guide.html** - 功能启用指南页面

## 开发常用命令

### 调试和测试
```bash
# 重新加载扩展（在chrome://extensions/页面点击刷新按钮）

# 测试扩展功能
# 1. 打开chrome://extensions/，确保开发者模式已启用
# 2. 点击"加载已解压的扩展程序"，选择项目目录
# 3. 点击扩展图标测试功能
# 4. 右键点击扩展图标，选择"检查弹出内容"进行调试

# 查看控制台日志
# 在popup中：右键扩展图标 -> 检查弹出内容 -> Console面板
# 在background中：chrome://extensions/ -> 扩展详情 -> "检查视图: Service Worker"

# 运行测试文件
open test*.html  # 在浏览器中打开测试页面
```

### 文件监控
```bash
# 监控JS文件变化（需要手动重新加载扩展）
ls -la *.js *.html *.css
```

## 核心架构组件

### 预设系统架构
- **内置预设** - 4个预设组合（DeepSeek+Kimi, Claude+ChatGPT, GitHub+ChatGPT, Google+Wikipedia）
- **自定义预设** - 用户可添加/编辑/删除自定义组合
- **预设数据结构** - `{id, leftUrl, rightUrl, leftIcon, rightIcon, leftName, rightName}`
- **实时保存** - 使用防抖机制（1000ms延迟）自动保存到chrome.storage.local

### 消息传递架构
```javascript
// 主要消息类型
chrome.runtime.sendMessage({
  action: 'createSplitScreen' | 'createAlternativeSplit' | 'checkSplitViewSupport',
  data: { website1, website2 }
});
```

### 窗口创建逻辑
1. **屏幕检测** - chrome.system.display.getInfo()获取屏幕信息
2. **布局计算** - 窗口宽度 = 屏幕宽度/2 - 10px间隙
3. **窗口创建** - chrome.windows.create()创建两个并排窗口
4. **位置定位** - 左窗口(0,0)，右窗口(窗口宽度+间隙,0)

### 关键API集成
- `chrome.windows.create()` - 创建新浏览器窗口
- `chrome.system.display.getInfo()` - 获取屏幕信息
- `chrome.storage.local.set/get()` - 本地数据存储
- `chrome.runtime.sendMessage()` - 组件间消息传递
- `chrome.tabs.query({active: true, currentWindow: true})` - 获取当前标签页

## 数据存储

### Chrome Storage使用
- **存储位置** - `chrome.storage.local`
- **数据结构** -
  ```javascript
  {
    customPresets: [...], // 自定义预设组合
    rememberLayout: true, // 是否记住布局设置
    firstTime: false,     // 是否首次使用
    lastSaved: timestamp  // 最后保存时间
  }
  ```

### 网站识别系统
- **图标映射** - 自动识别网站并显示对应emoji图标
- **URL验证** - 智能验证URL格式和有效性
- **当前页面** - 支持一键获取当前浏览页面URL

## 权限要求

扩展需要以下权限：
- `windows` - 创建和管理浏览器窗口
- `tabs` - 获取当前标签页信息
- `storage` - 本地数据存储
- `system.display` - 获取屏幕信息
- `activeTab` - 访问当前活动标签页

## 关键实现细节

### UI交互模式
- **查看模式** - 显示预设信息，一键分屏
- **编辑模式** - 可修改URL，实时保存
- **添加模式** - 动态添加新的自定义预设

### 事件处理机制
- **事件委托** - 处理动态生成的预设元素
- **防抖保存** - 避免频繁存储操作（1000ms延迟）
- **Toast通知** - 用户友好的操作反馈

### 错误处理策略
- **API调用包装** - 所有Chrome API调用都有try-catch包装
- **用户提示** - 友好的错误提示和操作指导
- **日志记录** - 详细的控制台日志便于调试

## 测试文件

项目包含完整的测试套件：
- `test.html` - 基础功能测试
- `test-custom-presets.html` - 自定义预设功能测试
- `test-fullscreen.html` - 全屏功能测试
- `quick-test.html` - 快速功能验证
- `test-validation.js` - URL验证测试

## 文件组织

### 核心文件
- `manifest.json` - 扩展配置和权限声明
- `popup.js` (1008行) - 主要业务逻辑，包含预设管理和UI交互
- `background.js` (224行) - 后台服务，处理窗口创建
- `popup.html` - 弹窗UI结构（400px固定宽度）
- `popup.css` (12.8KB) - 样式定义，使用BEM命名规范

### 辅助文件
- `guide.html` - 功能启用指南页面
- `manifest-store.json` - Chrome Web Store发布配置
- 多个`.md`文档 - 开发和发布相关文档

## 开发规范

### JavaScript模式
- **ES6+语法** - 使用const/let、箭头函数、模板字符串
- **异步编程** - 统一使用async/await模式
- **模块化组织** - 功能模块化，职责分离
- **错误优先处理** - 完善的错误处理机制

### CSS架构
- **BEM命名** - 块-元素-修饰符命名规范
- **响应式设计** - 支持不同屏幕尺寸
- **无外部依赖** - 使用emoji图标，避免图标库依赖