const http = require('http');

const testApi = async (url, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

(async () => {
  try {
    console.log('测试新增交易策略...\n');

    const newStrategy = {
      strategy_type: 'test_type',
      name: 'API测试_临时',
      status: '启用'
    };

    const result = await testApi('/api/trading_strategies', 'POST', newStrategy);

    console.log('HTTP状态码:', result.status);
    console.log('响应数据:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('错误:', error.message);
  }
})();
