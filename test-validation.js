// 测试URL验证函数的简单脚本
// 可以在Node.js环境中运行

// 模拟Chrome扩展中的URL验证函数
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

// 测试用例
const testCases = [
  { input: 'https://www.google.com', expected: true, description: '有效的HTTPS URL' },
  { input: 'http://example.com', expected: true, description: '有效的HTTP URL' },
  { input: 'google.com', expected: true, description: '无协议前缀的域名' },
  { input: 'www.github.com', expected: true, description: '带www的域名' },
  { input: 'chat.openai.com', expected: true, description: '子域名' },
  { input: '', expected: false, description: '空字符串' },
  { input: '   ', expected: false, description: '只有空格' },
  { input: 'invalid-url', expected: true, description: '被当作域名的字符串（会添加https://前缀）' },
  { input: 'ftp://example.com', expected: false, description: '非HTTP协议' },
  { input: 'chrome://extensions', expected: true, description: 'Chrome协议' },
  { input: 'about:blank', expected: true, description: 'About协议' }
];

console.log('开始测试URL验证函数...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = isValidUrl(testCase.input);
  const status = result === testCase.expected ? '✅ 通过' : '❌ 失败';

  console.log(`测试 ${index + 1}: ${testCase.description}`);
  console.log(`输入: "${testCase.input}"`);
  console.log(`预期: ${testCase.expected}, 实际: ${result} - ${status}`);
  console.log('---');

  if (result === testCase.expected) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\n测试结果总结:`);
console.log(`通过: ${passed} / ${testCases.length}`);
console.log(`失败: ${failed} / ${testCases.length}`);
console.log(`成功率: ${((passed / testCases.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 所有测试通过！');
} else {
  console.log('\n⚠️ 有测试失败，请检查验证逻辑');
}