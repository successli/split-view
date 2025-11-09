#!/usr/bin/env node

// Split View Chrome Extension 测试脚本
// 用于验证项目文件的完整性和基本功能

const fs = require('fs');
const path = require('path');

console.log('🔍 Split View Chrome Extension 项目测试\n');

// 测试结果统计
let testsPassed = 0;
let testsTotal = 0;

function test(description, condition) {
  testsTotal++;
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${description}`);
  if (condition) testsPassed++;
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  test(`${description}: ${filePath}`, exists);
  return exists;
}

function checkFileContent(filePath, patterns, description) {
  if (!fs.existsSync(filePath)) {
    test(`${description}: 文件不存在`, false);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let allPatternsFound = true;

  patterns.forEach(pattern => {
    const found = content.includes(pattern);
    test(`${description} 包含 "${pattern}"`, found);
    if (!found) allPatternsFound = false;
  });

  return allPatternsFound;
}

// 1. 检查必需文件
console.log('📁 检查必需文件:');
checkFileExists('manifest.json', 'Manifest文件');
checkFileExists('popup.html', 'Popup HTML文件');
checkFileExists('popup.css', 'Popup CSS文件');
checkFileExists('popup.js', 'Popup JS文件');
checkFileExists('background.js', 'Background脚本');
checkFileExists('guide.html', '引导页面');
checkFileExists('README.md', '项目文档');
checkFileExists('icons/README.md', '图标说明文档');

// 2. 检查manifest.json内容
console.log('\n📋 检查manifest.json:');
checkFileContent('manifest.json', [
  '"manifest_version": 3',
  '"name": "Split View',
  '"permissions":',
  '"windows"',
  '"tabs"',
  '"storage"',
  '"background"',
  '"action"'
], 'Manifest配置');

// 3. 检查popup.html结构
console.log('\n🎨 检查popup.html:');
checkFileContent('popup.html', [
  '<!DOCTYPE html>',
  '<link rel="stylesheet" href="popup.css">',
  '<script src="popup.js">',
  'id="btn-split"',
  'id="status-checking"',
  'class="container"'
], 'Popup HTML结构');

// 4. 检查popup.js功能
console.log('\n⚡ 检查popup.js:');
checkFileContent('popup.js', [
  'chrome.runtime.sendMessage',
  'startSplitView',
  'checkSplitViewStatus',
  'getWebsiteUrl',
  'isValidUrl',
  'showSuccess',
  'showError'
], 'Popup JS功能');

// 5. 检查background.js功能
console.log('\n🔧 检查background.js:');
checkFileContent('background.js', [
  'chrome.runtime.onMessage.addListener',
  'handleCreateAlternativeSplit',
  'calculateOptimalLayout',
  'chrome.windows.create',
  'detectSplitViewSupport',
  'getScreenInfo'
], 'Background JS功能');

// 6. 检查guide.html引导页面
console.log('\n📖 检查guide.html:');
checkFileContent('guide.html', [
  'Split View 启用指南',
  'chrome://flags/#split-view',
  'openChromeFlags',
  'checkSplitViewStatus',
  'testSplitView'
], '引导页面内容');

// 7. 检查CSS样式
console.log('\n🎭 检查popup.css:');
checkFileContent('popup.css', [
  '.container',
  '.btn',
  '.status-item',
  '.template-btn',
  '.mode-btn'
], 'CSS样式定义');

// 8. 检查JavaScript语法
console.log('\n✍️ 检查JavaScript语法:');

function checkJSSyntax(filePath) {
  try {
    require(filePath);
    test(`${filePath} 语法检查`, false); // 如果能require说明不是纯JS
  } catch (error) {
    // 检查是否是语法错误
    if (error.message.includes('Unexpected token')) {
      test(`${filePath} 语法检查`, false);
    } else {
      test(`${filePath} 语法检查`, true);
    }
  }
}

// 使用Node.js检查语法
function validateJSSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    new Function(content);
    test(`${filePath} 语法检查`, true);
    return true;
  } catch (error) {
    test(`${filePath} 语法检查: ${error.message}`, false);
    return false;
  }
}

validateJSSyntax('popup.js');
validateJSSyntax('background.js');

// 9. 检查文件大小合理性
console.log('\n📏 检查文件大小:');
function checkFileSize(filePath, maxSizeKB, description) {
  if (!fs.existsSync(filePath)) {
    test(`${description} 文件大小检查`, false);
    return;
  }

  const stats = fs.statSync(filePath);
  const sizeKB = stats.size / 1024;
  test(`${description} 文件大小合理 (${sizeKB.toFixed(1)}KB < ${maxSizeKB}KB)`, sizeKB < maxSizeKB);
}

checkFileSize('manifest.json', 10, 'Manifest');
checkFileSize('popup.html', 50, 'Popup HTML');
checkFileSize('popup.css', 20, 'Popup CSS');
checkFileSize('popup.js', 30, 'Popup JS');
checkFileSize('background.js', 50, 'Background JS');
checkFileSize('guide.html', 100, 'Guide HTML');

// 10. 检查关键权限
console.log('\n🔐 检查关键权限配置:');
const manifestContent = fs.readFileSync('manifest.json', 'utf8');
const requiredPermissions = ['windows', 'tabs', 'storage', 'activeTab'];
requiredPermissions.forEach(permission => {
  test(`包含权限: ${permission}`, manifestContent.includes(`"${permission}"`));
});

// 11. 安全性检查
console.log('\n🛡️ 安全性检查:');
function checkSecurityIssues() {
  let securityIssues = 0;

  // 检查是否有eval()等危险函数
  const jsFiles = ['popup.js', 'background.js'];
  jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const dangerousFunctions = ['eval(', 'innerHTML', 'document.write'];
      dangerousFunctions.forEach(func => {
        if (content.includes(func)) {
          test(`安全检查: ${file} 包含 ${func}`, false);
          securityIssues++;
        }
      });
    }
  });

  if (securityIssues === 0) {
    test('安全性检查: 未发现明显安全问题', true);
  }

  return securityIssues === 0;
}

checkSecurityIssues();

// 测试结果总结
console.log(`\n📊 测试结果总结:`);
console.log(`✅ 通过: ${testsPassed}/${testsTotal}`);
console.log(`❌ 失败: ${testsTotal - testsPassed}/${testsTotal}`);

const successRate = (testsPassed / testsTotal * 100).toFixed(1);
console.log(`📈 成功率: ${successRate}%`);

if (testsPassed === testsTotal) {
  console.log('\n🎉 所有测试通过！Split View Chrome Extension 已准备就绪！');
  console.log('\n📝 下一步操作:');
  console.log('1. 在Chrome中打开 chrome://extensions/');
  console.log('2. 启用"开发者模式"');
  console.log('3. 点击"加载已解压的扩展程序"');
  console.log('4. 选择当前项目文件夹');
  console.log('5. 点击扩展图标开始使用！');
} else {
  console.log('\n⚠️ 部分测试失败，请检查上述问题并修复后重新测试。');
}

console.log('\n💡 提示:');
console.log('- 图标文件需要手动添加到 icons/ 目录');
console.log('- 建议在实际Chrome环境中测试功能');
console.log('- 可以使用Chrome DevTools调试扩展');

// 退出码
process.exit(testsPassed === testsTotal ? 0 : 1);