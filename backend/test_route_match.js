const express = require('express');
const app = express();

app.use(express.json());

// 测试路由顺序
app.delete('/:table/:id', (req, res, next) => {
  console.log('Route 1 matched: /:table/:id');
  console.log('  table:', req.params.table, 'id:', req.params.id);

  if (req.params.id === 'bulk') {
    console.log('  -> Skipping to next route');
    return next('route');
  }

  console.log('  -> Processing DELETE by ID');
  res.json({ route: 'by-id', table: req.params.table, id: req.params.id });
});

app.delete('/:table/bulk', (req, res) => {
  console.log('Route 2 matched: /:table/bulk');
  console.log('  table:', req.params.table);
  console.log('  body:', req.body);
  res.json({ route: 'bulk', table: req.params.table, body: req.body });
});

// 测试
const testPaths = [
  { path: '/daily_work_data/123', method: 'DELETE', body: null },
  { path: '/daily_work_data/bulk', method: 'DELETE', body: { dates: ['2026-03-10'] } }
];

async function test() {
  for (const test of testPaths) {
    console.log('\n--- Testing:', test.path, '---');
    const req = {
      params: {},
      path: test.path,
      body: test.body || {},
      method: test.method
    };

    // 解析路径参数
    const parts = test.path.split('/').filter(p => p);
    req.params.table = parts[0];
    req.params.id = parts[1];

    const res = {
      json: (data) => {
        console.log('Response:', JSON.stringify(data));
      }
    };

    // 模拟Express路由匹配
    if (test.path.match(/\/[^\/]+\/bulk$/)) {
      console.log('Would match bulk route');
    } else if (test.path.match(/\/[^\/]+\/[^\/]+$/)) {
      console.log('Would match :id route');
    }
  }
}

test();
