// 模拟前端通过代理访问后端
const http = require('http');

async function test() {
  console.log('=== 测试后端 /api/sync/all 接口 ===\n');

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/sync/all',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5173'
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      console.log('状态码:', res.statusCode);
      console.log('响应头:');
      for (const [key, value] of Object.entries(res.headers)) {
        console.log(`  ${key}: ${value}`);
      }

      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('\n响应体长度:', body.length);
        console.log('响应体前200字符:', body.substring(0, 200));

        try {
          const result = JSON.parse(body);
          console.log('\n✅ 解析成功');
          console.log('success:', result.success);
          if (result.data) {
            console.log('包含的表:', Object.keys(result.data));
          }
          resolve(true);
        } catch (e) {
          console.log('\n❌ 解析失败:', e.message);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ 请求错误:', err.message);
      resolve(false);
    });

    req.end();
  });
}

test();
