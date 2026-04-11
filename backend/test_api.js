const https = require('https');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/market-quotes/itick-market',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const data = JSON.stringify({
  count: 1,
  symbols: ["301568"]
});

const req = https.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('响应数据:', responseData);
    try {
      const jsonResponse = JSON.parse(responseData);
      console.log('解析后的响应:', jsonResponse);
    } catch (error) {
      console.log('响应解析失败:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error.message);
});

req.write(data);
req.end();