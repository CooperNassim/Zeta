import axios from 'axios';

// 测试Tushare API的直接访问
async function testTushareDirectly() {
  try {
    const testToken = 'your_tushare_token_here'; // 需要有效的Tushare token
    const params = {
      api_name: 'stock_basic',
      token: testToken,
      fields: 'symbol,name,area,industry,market,list_date,list_status,exchange',
      list_status: 'L' // 只获取已上市的股票
    };
    
    console.log('🚀 测试直接访问Tushare API...');
    console.log('请求参数:', params);
    
    const response = await axios.post('https://tushare.pro/api', params, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('✅ Tushare API调用成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', response.data);
    
  } catch (error) {
    console.error('❌ Tushare API调用失败!');
    console.error('错误类型:', error.name);
    console.error('错误消息:', error.message);
    
    if (error.response) {
      console.error('HTTP状态码:', error.response.status);
      console.error('状态文本:', error.response.statusText);
      console.error('响应头:', error.response.headers);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求对象:', error.request);
    }
    console.error('错误配置:', error.config);
  }
}

// 运行测试
testTushareDirectly().then(() => {
  console.log('测试完成');
  process.exit(0);
}).catch(error => {
  console.error('测试过程出错:', error);
  process.exit(1);
});