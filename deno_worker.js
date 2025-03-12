// Deno script for SiliconFlow Balance Checker - Optimized Version

import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // 处理 API 请求
  if (url.pathname === '/api/check-token') {
    if (request.method === 'POST') {
      try {
        const { token } = await request.json();
        return await checkToken(token);
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return new Response('Method not allowed', { status: 405 });
  }

  // 为所有其他请求提供主 HTML 页面
  return new Response(getHTML(), {
    headers: { 'Content-Type': 'text/html' },
  });
}

async function checkToken(token: string): Promise<Response> {
  try {
    const apiResponse = await fetch('https://api.siliconflow.cn/v1/user/info', { // 直接请求 /v1/user/info
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (apiResponse.ok) { // 200 响应表示 API KEY 有效
      const balanceData = await apiResponse.json();
      const balance = balanceData.data.totalBalance;
      return new Response(JSON.stringify({ isValid: true, balance }), { // 返回有效和余额
        headers: { 'Content-Type': 'application/json' }
      });
    } else { // 非 200 响应表示 API KEY 无效
      let errorMessage = 'API KEY 无效'; // 默认错误消息
      try {
        const errorText = await apiResponse.text(); // 尝试获取错误响应文本
        errorMessage = errorText; // 使用接口返回的错误信息
      } catch (e) {
        // 如果解析错误响应文本失败，则使用默认错误消息
        console.error("解析错误响应失败:", e);
      }
      return new Response(JSON.stringify({ isValid: false, message: errorMessage }), { // 返回无效和错误消息
        status: apiResponse.status, // 可以返回原始状态码，方便调试
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ isValid: false, message: `请求失败: ${error.message}` }), { // 网络请求失败
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function getHTML(): string {
  return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SiliconFlow Token 余额检测</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css">
    <style>
      .token-container {
        max-height: 300px;
        overflow-y: auto;
      }

      .fadeIn {
        animation: fadeIn 0.5s;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .pulse {
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% { transform: scale(0.95); }
        50% { transform: scale(1); }
        100% { transform: scale(0.95); }
      }

      .loader {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #3B82F6;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        animation: spin 1s linear infinite;
        display: inline-block;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body class="bg-gray-50 text-gray-800">
    <div class="min-h-screen py-8 px-4">
      <div class="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div class="p-8">
          <div class="flex items-center justify-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800">SiliconFlow Token 余额检测</h1>
          </div>

          <div class="mb-6">
            <label for="balanceThreshold" class="block text-sm font-medium text-gray-700 mb-2">最低余额阈值：</label>
            <input type="number" id="balanceThreshold" value="0.5" min="0" step="0.1"
              class="w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
          </div>

          <div class="mb-6">
            <label for="tokens" class="block text-sm font-medium text-gray-700 mb-2">请输入 SiliconFlow API Tokens</label>
            <textarea id="tokens" placeholder="请输入sk token，支持每行一个或用逗号分隔"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 h-40"></textarea>
          </div>

          <div class="mb-8">
            <button id="checkButton"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              检测账号
            </button>
          </div>

          <div id="resultsContainer" class="space-y-8 hidden">
            <!-- Valid tokens section -->
            <div class="fadeIn">
              <div class="flex items-center mb-3">
                <div class="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <h2 class="text-lg font-semibold text-gray-800">有余额账号</h2>
                <span id="validCount" class="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-sm rounded-full">0</span>
              </div>
              <div id="validResults" class="token-container bg-gray-50 border border-gray-200 rounded-md p-4 text-sm font-mono whitespace-pre-wrap"></div>
              <div class="flex mt-3 space-x-2">
                <button id="copyButton" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md text-sm hidden">
                  复制有余额账号
                </button>
                <button id="copyCommaButton" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md text-sm hidden">
                  复制有余额账号(逗号连接)
                </button>
              </div>
            </div>

            <!-- Zero balance tokens section -->
            <div class="fadeIn">
              <div class="flex items-center mb-3">
                <div class="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                <h2 class="text-lg font-semibold text-gray-800">零余额账号</h2>
                <span id="zeroCount" class="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-sm rounded-full">0</span>
              </div>
              <div id="zeroBalanceResults" class="token-container bg-gray-50 border border-gray-200 rounded-md p-4 text-sm font-mono whitespace-pre-wrap"></div>
              <div class="flex mt-3 space-x-2">
                <button id="copyZeroButton" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded-md text-sm hidden">
                  复制零余额账号
                </button>
                <button id="copyZeroCommaButton" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded-md text-sm hidden">
                  复制零余额账号(逗号连接)
                </button>
              </div>
            </div>

            <!-- Invalid tokens section -->
            <div class="fadeIn">
              <div class="flex items-center mb-3">
                <div class="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <h2 class="text-lg font-semibold text-gray-800">失效账号</h2>
                <span id="invalidCount" class="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-sm rounded-full">0</span>
              </div>
              <div id="invalidResults" class="token-container bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3"></div>
            </div>

            <!-- Duplicate tokens section -->
            <div class="fadeIn">
              <div class="flex items-center mb-3">
                <div class="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                <h2 class="text-lg font-semibold text-gray-800">重复账号</h2>
                <span id="duplicateCount" class="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-sm rounded-full">0</span>
              </div>
              <div id="duplicateResults" class="token-container bg-gray-50 border border-gray-200 rounded-md p-4 text-sm font-mono whitespace-pre-wrap"></div>
            </div>
          </div>

          <!-- Loading indicator -->
          <div id="loadingIndicator" class="hidden">
            <div class="flex flex-col items-center justify-center py-12">
              <div class="loader mb-4"></div>
              <p class="text-gray-600" id="progressText">正在检测账号... (0/0)</p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 text-center text-gray-500 text-sm">
        <p>SiliconFlow Token 余额检测工具 - 部署于 Deno</p>
      </div>
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const tokensTextarea = document.getElementById('tokens');
        const checkButton = document.getElementById('checkButton');
        const validResults = document.getElementById('validResults');
        const zeroBalanceResults = document.getElementById('zeroBalanceResults');
        const invalidResults = document.getElementById('invalidResults');
        const duplicateResults = document.getElementById('duplicateResults');
        const copyButton = document.getElementById('copyButton');
        const copyZeroButton = document.getElementById('copyZeroButton');
        const copyCommaButton = document.getElementById('copyCommaButton');
        const copyZeroCommaButton = document.getElementById('copyZeroCommaButton');
        const resultsContainer = document.getElementById('resultsContainer');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const validCount = document.getElementById('validCount');
        const zeroCount = document.getElementById('zeroCount');
        const invalidCount = document.getElementById('invalidCount');
        const duplicateCount = document.getElementById('duplicateCount');
        const progressText = document.getElementById('progressText');

        checkButton.addEventListener('click', checkTokens);
        copyButton.addEventListener('click', () => copyTokens('valid'));
        copyZeroButton.addEventListener('click', () => copyTokens('zero'));
        copyCommaButton.addEventListener('click', () => copyTokensWithComma('valid'));
        copyZeroCommaButton.addEventListener('click', () => copyTokensWithComma('zero'));

        async function checkTokens() {
          const inputText = tokensTextarea.value.trim();
          let tokens = [];
          let tokenCount = new Map();
          let duplicateTokens = new Set();

          // Split input by lines
          const lines = inputText.split('\\n');

          // Process each line, split by comma if present
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              const lineTokens = trimmedLine.split(',')
                .map(t => t.trim())
                .filter(t => t !== '');
              lineTokens.forEach(token => {
                tokenCount.set(token, (tokenCount.get(token) || 0) + 1);
                if (tokenCount.get(token) > 1) {
                  duplicateTokens.add(token);
                }
              });
              tokens = tokens.concat(lineTokens);
            }
          });

          // Remove duplicates
          tokens = [...new Set(tokens)].filter(token => token !== '');

          if (tokens.length === 0) {
            alert('请输入至少一个token');
            return;
          }

          // Show duplicate tokens
          duplicateResults.textContent = duplicateTokens.size > 0
            ? \`发现 \${duplicateTokens.size} 个重复token：\\n\${[...duplicateTokens].join('\\n')}，已处理。\`
            : '没有发现重复的token';
          duplicateCount.textContent = duplicateTokens.size;

          // Prepare UI for checking
          checkButton.disabled = true;
          validResults.textContent = '';
          zeroBalanceResults.textContent = '';
          invalidResults.innerHTML = '';
          copyButton.style.display = 'none';
          copyZeroButton.style.display = 'none';
          copyCommaButton.style.display = 'none';
          copyZeroCommaButton.style.display = 'none';
          resultsContainer.classList.add('hidden');
          loadingIndicator.classList.remove('hidden');

          const validTokens = [];
          const zeroBalanceTokens = [];
          const invalidTokensResults = [];
          let completed = 0;

          // Process tokens concurrently
          const concurrencyLimit = 20; // 可以根据需要调整并发数量
          const chunks = [];
          for (let i = 0; i < tokens.length; i += concurrencyLimit) {
            chunks.push(tokens.slice(i, i + concurrencyLimit));
          }

          for (const chunk of chunks) {
            const promises = chunk.map(async (token) => {
              const result = await checkSingleToken(token);
              completed++;
              progressText.textContent = \`正在检测账号... (\${completed}/\${tokens.length})\`;
              return result;
            });

            const results = await Promise.all(promises);

            results.forEach(result => {
              if (!result.isValid) {
                invalidTokensResults.push(result); //  失效账号直接加入 invalidTokensResults
              } else {
                const balance = parseFloat(result.balance);
                const threshold = parseFloat(document.getElementById('balanceThreshold').value) || 0;
                if (balance >= threshold) {
                  validTokens.push({
                    token: result.token,
                    balance: balance
                  });
                } else {
                  zeroBalanceTokens.push(\`\${result.token} (余额: \${result.balance})\`);
                }
              }
            });
          }

          // Sort tokens by balance (highest first)
          validTokens.sort((a, b) => b.balance - a.balance);

          // Update UI with results
          validResults.textContent = validTokens.map(item => \`\${item.token} (余额: \${item.balance})\`).join('\\n');
          zeroBalanceResults.textContent = zeroBalanceTokens.join('\\n');

          invalidTokensResults.forEach(result => {
            const div = document.createElement('div');
            div.className = 'bg-red-50 border border-red-200 rounded-md p-3';
            div.innerHTML = \`
              <div class="flex flex-col">
                <div class="font-mono bg-white p-2 border border-red-200 rounded-md mb-2 break-all text-sm">\${result.token}</div>
                <div class="text-red-600 font-medium text-sm">\${result.message}</div>
              </div>
            \`;
            invalidResults.appendChild(div);
          });

          // Update counts
          validCount.textContent = validTokens.length;
          zeroCount.textContent = zeroBalanceTokens.length;
          invalidCount.textContent = invalidTokensResults.length;

          // Show copy buttons if needed
          if (validTokens.length > 0) {
            copyButton.style.display = 'block';
            copyCommaButton.style.display = 'block';
          }
          if (zeroBalanceTokens.length > 0) {
            copyZeroButton.style.display = 'block';
            copyZeroCommaButton.style.display = 'block';
          }

          // Reset UI state
          checkButton.disabled = false;
          loadingIndicator.classList.add('hidden');
          resultsContainer.classList.remove('hidden');
        }

        async function checkSingleToken(token) {
          try {
            const response = await fetch('/api/check-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });

            const data = await response.json();
            return { token, ...data };
          } catch (error) {
            return { token, isValid: false, message: \`请求失败: \${error.message}\` };
          }
        }

        function copyTokens(type) {
          const resultsDiv = type === 'valid' ? validResults : zeroBalanceResults;
          const tokens = resultsDiv.textContent.split('\\n').map(line => line.split(' ')[0]);
          navigator.clipboard.writeText(tokens.join('\\n'))
            .then(() => {
              alert(type === 'valid' ? '有余额账号已复制到剪贴板' : '零余额账号已复制到剪贴板');
            })
            .catch(err => {
              console.error('复制失败:', err);
              fallbackCopy(tokens.join('\\n'));
            });
        }

        function copyTokensWithComma(type) {
          const resultsDiv = type === 'valid' ? validResults : zeroBalanceResults;
          const tokens = resultsDiv.textContent.split('\\n').map(line => line.split(' ')[0]);
          navigator.clipboard.writeText(tokens.join(','))
            .then(() => {
              alert(type === 'valid' ? '有余额账号已复制到剪贴板(逗号连接)' : '零余额账号已复制到剪贴板(逗号连接)');
            })
            .catch(err => {
              console.error('复制失败:', err);
              fallbackCopy(tokens.join(','));
            });
        }

        function fallbackCopy(text) {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
      });
    </script>
  </body>
  </html>`;
}

// 启动 Deno HTTP 服务器
serve(handleRequest, { port: 8000 }); // 默认监听 8000 端口
// console.log('Deno HTTP server 在 http://localhost:8000 上运行');
