const { findAll } = require('./src/database/queries');

(async () => {
  try {
    const results = await findAll('psychological_test_results');
    console.log('=== 心理测试结果 ===');
    console.log('总数:', results.length);
    if (results.length > 0) {
      console.log('第一条记录:');
      console.log(JSON.stringify(results[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
