// 测试所有可用的路由
const http = require('http');

const routes = [
  { method: 'GET', path: '/api/test' },
  { method: 'GET', path: '/api/psychological_test_results' },
  { method: 'POST', path: '/api/psychological_test_results', body: { test_date: '2026-03-12', scores: {}, overall_score: 0, notes: '' } },
  { method: 'PUT', path: '/api/psychological_test_results/by-date/2026-03-12', body: { scores: {}, overall_score: 0, notes: '' } }
];

async function testRoute(route) {
  return new Promise((resolve, reject) => {
    const body = route.body ? JSON.stringify(route.body) : null;

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: route.path,
      method: route.method,
      headers: {}
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ path: route.path, method: route.method, status: res.statusCode, body: data });
      });
    });

    req.on('error', err => {
      resolve({ path: route.path, method: route.method, error: err.message });
    });

    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Testing routes...\n');

  for (const route of routes) {
    const result = await testRoute(route);
    if (result.error) {
      console.log(`❌ ${result.method} ${result.path}: ${result.error}`);
    } else {
      const status = result.status === 200 || result.status === 201 ? '✅' : '❌';
      console.log(`${status} ${result.method} ${result.path}: ${result.status}`);
    }
  }
}

main().then(() => process.exit(0));
