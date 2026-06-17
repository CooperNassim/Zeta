async function testLogin() {
  try {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.token) {
      // 测试带认证的请求
      const syncRes = await fetch('http://localhost:3001/api/sync/all', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      console.log('\nSync API Status:', syncRes.status);
      
      // 测试无认证的请求
      const noAuthRes = await fetch('http://localhost:3001/api/sync/all');
      console.log('No-auth Sync API Status:', noAuthRes.status);

      // 测试数据库管理接口（需要 admin 权限）
      const dbRes = await fetch('http://localhost:3001/api/database/info', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      console.log('Database info Status:', dbRes.status);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
testLogin();
