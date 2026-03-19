import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sync/all',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.success && result.data && result.data.psychological_test_results) {
      console.log('心理测试数据:');
      result.data.psychological_test_results.forEach(t => {
        console.log('ID:', t.id);
        console.log('test_date:', t.test_date);
        console.log('scores:', JSON.stringify(t.scores));
        console.log('overall_score:', t.overall_score, typeof t.overall_score);
        console.log('---');
      });
    }
  });
});

req.on('error', (error) => {
  console.error('错误:', error);
});

req.end();
