# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个Chrome浏览器扩展程序，名为"Split View"，用于提供分屏浏览功能。该扩展支持Chrome实验性的Split View功能，同时提供基于窗口管理的替代分屏方案。

## 核心架构

### 扩展结构
- **Manifest V3** - 使用最新的Chrome扩展API规范
- **Service Worker** - background.js作为后台服务脚本
- **弹出界面** - popup.html/popup.js/popup.css提供用户交互界面
- **引导页面** - guide.html提供Split View功能启用指南

### 主要组件
1. **popup.js** - 前端逻辑，处理用户界面交互和分屏请求
2. **background.js** - 后台服务，处理窗口创建和消息传递
3. **popup.html** - 扩展弹窗的HTML结构
4. **guide.html** - Split View启用指南页面

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
```

### 文件监控
```bash
# 监控JS文件变化（需要手动重新加载扩展）
ls -la *.js *.html *.css
```

## 核心功能实现

### 分屏功能流程
1. **用户交互** (popup.js) →
2. **消息传递** (chrome.runtime.sendMessage) →
3. **后台处理** (background.js) →
4. **窗口创建** (chrome.windows.create) →
5. **布局计算** (getScreenInfo, calculateOptimalLayout)

### 关键API使用
- `chrome.windows.create()` - 创建新浏览器窗口
- `chrome.system.display.getInfo()` - 获取屏幕信息
- `chrome.storage.local.set()` - 本地数据存储
- `chrome.runtime.sendMessage()` - 组件间消息传递
- `chrome.action.openPopup()` - 打开扩展弹窗

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

### 预设数据管理
- 内置预设（AI对话、工作模式等）
- 用户自定义预设
- 实时保存和加载
- URL验证和图标映射

## 权限要求

扩展需要以下权限：
- `windows` - 创建和管理浏览器窗口
- `tabs` - 获取当前标签页信息
- `storage` - 本地数据存储
- `system.display` - 获取屏幕信息
- `activeTab` - 访问当前活动标签页

## 开发注意事项

### 兼容性处理
- 支持Chrome实验性Split View功能的检测
- 提供窗口管理替代方案
- 处理不同平台的屏幕尺寸差异

### 错误处理
- 所有Chrome API调用都有try-catch包装
- 用户友好的错误提示（Toast通知）
- 详细的控制台日志记录

### 性能优化
- 防抖处理避免频繁保存（1000ms延迟）
- 异步操作使用async/await
- 事件委托处理动态元素

## 测试方法

### 功能测试
1. **基础分屏** - 测试预设组合的一键分屏
2. **自定义组合** - 测试添加/编辑/删除自定义预设
3. **URL验证** - 测试各种URL格式的处理
4. **存储功能** - 测试设置的保存和加载
5. **跨窗口** - 测试窗口创建和布局

### 兼容性测试
- 不同Chrome版本测试
- 不同屏幕分辨率测试
- 操作系统差异测试（Windows/macOS/Linux）

## 故障排除

### 常见问题
1. **扩展无法加载** - 检查manifest.json格式
2. **窗口创建失败** - 检查权限设置
3. **布局异常** - 检查屏幕信息获取
4. **存储失败** - 检查storage权限

### 调试技巧
- 使用console.log详细记录执行流程
- 在Chrome DevTools中检查网络请求
- 验证manifest.json中的权限配置
- 检查Chrome扩展管理页面的错误信息

## 文件组织

### 核心文件
- `manifest.json` - 扩展配置
- `popup.js` (825行) - 主要业务逻辑
- `background.js` (200行) - 后台服务
- `popup.html` - UI结构
- `popup.css` - 样式定义

### 辅助文件
- `guide.html` - 用户指南
- `test*.html` - 测试页面
- `DEBUG.md` - 调试指南
- `README.md` - 项目文档

## 代码规范

### JavaScript规范
- 使用ES6+语法（const/let、箭头函数、模板字符串）
- 遵循异步编程最佳实践
- 函数命名使用camelCase，变量名语义化
- 适当的注释和错误处理

### HTML/CSS规范
- 语义化HTML结构
- 响应式设计支持
- CSS类名使用BEM风格
- 避免内联样式和脚本

## 部署和发布

### 开发环境设置
1. 克隆项目到本地
2. 在Chrome中启用开发者模式
3. 加载解压的扩展程序
4. 测试所有功能

### 生产准备
- 检查所有错误处理
- 优化性能和内存使用
- 确保兼容性测试通过
- 准备Chrome Web Store发布材料