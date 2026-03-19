const http = require('http');

http.get('http://localhost:3001/api/sync/all', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log('psychological_test_results 数量:', result.data.psychological_test_results.length);
    if (result.data.psychological_test_results.length > 0) {
      console.log('第一条记录:');
      console.log(JSON.stringify(result.data.psychological_test_results[0], null, 2));
    }
  });
});
