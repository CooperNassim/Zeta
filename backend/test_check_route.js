const http = require('http');

// 测试不同的路径
const paths = [
  '/api/daily_work_data/bulk',  // 旧路径
  '/api/bulk/daily_work_data',  // 新路径
];

for (const path of paths) {
  console.log(`\n测试路径: ${path}`);
  console.log(`=`.repeat(50));

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: path,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify({ dates: ['2026-03-10'] }).length
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => { data += chunk; });

    res.on('end', () => {
      console.log(`状态码: ${res.statusCode}`);
      try {
        const parsed = JSON.parse(data);
        console.log(`响应: ${JSON.stringify(parsed)}`);
      } catch (e) {
        console.log(`响应: ${data}`);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`错误: ${err.message}`);
  });

  req.write(JSON.stringify({ dates: ['2026-03-10'] }));
  req.end();
}
