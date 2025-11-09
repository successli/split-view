# Chrome Web Store 发布检查清单

## 📋 发布前检查

### ✅ 基础文件检查
- [ ] `manifest.json` 配置完整且符合Manifest V3规范
- [ ] `manifest-store.json` 包含商店发布所需的额外配置
- [ ] `background.js` (生产版本使用 `background-clean.js`)
- [ ] `popup.html`, `popup.js`, `popup.css` 完整且无错误
- [ ] 所有HTML文件声明正确的DOCTYPE和字符编码
- [ ] 所有CSS和JS文件语法正确，无语法错误

### ✅ 权限和安全检查
- [ ] 权限使用合理，遵循最小权限原则
- [ ] 没有请求不必要的权限
- [ ] 没有使用危险的API（如eval()）
- [ ] 内容安全策略配置正确
- [ ] 用户数据处理符合隐私规范

### ✅ 功能完整性检查
- [ ] 所有核心功能正常工作
- [ ] 分屏功能在各种网站都能正常使用
- [ ] 自定义预设的添加、编辑、删除功能正常
- [ ] 重置功能有二次确认
- [ ] 版本号显示正确
- [ ] 错误处理完善，用户体验友好

### ✅ 用户体验检查
- [ ] 界面美观，布局合理
- [ ] 操作简单直观
- [ ] 响应式设计，适配不同屏幕
- [ ] 加载速度快，性能良好
- [ ] 无明显的UI bug或布局问题

### ✅ 商店发布文件
- [ ] 扩展图标 (16x16, 32x32, 48x48, 128x128 px)
- [ ] 商店截图 (1280x800 px 或 640x400 px)
- [ ] 隐私政策文件 (`PRIVACY.md`)
- [ ] 商店描述文件 (`STORE_LISTING.md`)
- [ ] 支持邮箱地址

### ✅ 代码质量检查
- [ ] 移除所有调试代码 (console.log, console.error等)
- [ ] 代码注释适当，易于理解
- [ ] 变量和函数命名规范
- [ ] 没有硬编码的测试数据或开发配置
- [ ] 错误处理完善

## 🏗️ 项目结构优化建议

### 建议的文件结构
```
split-view/
├── manifest.json              # 主配置文件
├── background.js              # 后台脚本
├── popup.html                 # 弹窗页面
├── popup.js                   # 弹窗逻辑
├── popup.css                  # 弹窗样式
├── guide.html                 # 用户指南
├── icons/                     # 扩展图标
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── PRIVACY.md                 # 隐私政策
├── README.md                  # 项目说明
└── screenshots/               # 商店截图
    ├── screenshot1.png
    ├── screenshot2.png
    ├── screenshot3.png
    └── screenshot4.png
```

### 需要清理的文件
- [ ] 移除开发测试文件 (`test-*.html`, `test-*.js`)
- [ ] 移除备份文件 (`*-original.js`, `*-simple.js`)
- [ ] 移除调试文件 (`popup-debug.js`)
- [ ] 移除临时文档 (`DEBUG.md`, `FIXES.md` 等)
- [ ] 移除 `.claude/` 目录

## 🚀 发布流程

### 1. 准备发布包
```bash
# 创建干净的发布版本目录
mkdir split-view-release
cp manifest.json split-view-release/
cp background-clean.js split-view-release/background.js
cp popup.html popup.js popup.css split-view-release/
cp guide.html split-view-release/
cp -r icons split-view-release/
cp PRIVACY.md split-view-release/
```

### 2. 创建扩展图标
需要以下尺寸的PNG图标：
- 16x16 px (扩展管理页面)
- 32x32 px (Windows等系统)
- 48x48 px (扩展管理页面)
- 128x128 px (Chrome Web Store)

### 3. 准备商店截图
需要至少1张，最多5张截图：
- 推荐1280x800 px或640x400 px
- 展示核心功能和使用场景
- 图片清晰，不包含无关内容

### 4. 提交审核
- 登录Chrome Web Store开发者控制台
- 上传扩展包
- 填写商店信息（使用STORE_LISTING.md中的内容）
- 提供隐私政策链接
- 等待审核通过

## ⚠️ 注意事项

1. **版本号管理**: 每次更新都需要递增版本号
2. **隐私政策**: 必须提供有效的隐私政策链接
3. **权限说明**: 在商店描述中清楚说明每个权限的用途
4. **审核时间**: 通常需要1-3个工作日审核
5. **政策合规**: 确保不违反Chrome Web Store政策

## 📞 技术支持

- 邮箱：support@splitview-extension.com
- GitHub：https://github.com/your-username/split-view-extension
- 问题反馈：https://github.com/your-username/split-view-extension/issues