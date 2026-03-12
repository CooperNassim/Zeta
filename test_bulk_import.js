const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    if (data) {
      options.body = JSON.stringify(data)
    }
    const response = await fetch(`http://localhost:3001${endpoint}`, options)
    return await response.json()
  } catch (error) {
    console.error('API调用失败:', error)
    return { success: false, error: error.message }
  }
}

// 测试批量导入
async function testBulkImport() {
  console.log('=== 开始测试批量导入 ===')

  // 准备测试数据
  const testData = [{
    date: '2026-03-11',
    nasdaq: '12345',
    ftse: '54321',
    dax: '23456',
    n225: '65432',
    hsi: '34567',
    bitcoin: '45678',
    eurusd: '1.2',
    usdjpy: '3.4',
    usdcny: '5.6',
    oil: '78.9',
    gold: '1234.5',
    bond: '567',
    consecutive: '1',
    a50: '6789',
    sh_index: '7890',
    sh_2day_power: '100',
    sh_13day_power: '200',
    up_count: '300',
    limit_up: '10',
    down_count: '200',
    limit_down: '5',
    volume: '5000',
    sentiment: '微热',
    prediction: '看涨',
    trade_status: '积极地',
    deleted: false,
    deleted_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }]

  console.log('1. 导入前的数据库数据:')
  const beforeData = await apiCall('/api/daily_work_data')
  console.log('   数据数量:', beforeData.data?.length || 0)

  console.log('\n2. 执行批量导入:')
  const importResult = await apiCall('/api/daily_work_data/bulk', 'POST', testData)
  console.log('   导入结果:', importResult)

  console.log('\n3. 导入后的数据库数据:')
  const afterData = await apiCall('/api/daily_work_data')
  console.log('   数据数量:', afterData.data?.length || 0)
  if (afterData.data && afterData.data.length > 0) {
    console.log('   最新数据:', JSON.stringify(afterData.data[0], null, 2))
  }

  console.log('\n4. 检查 sync/all 接口:')
  const syncData = await apiCall('/api/sync/all')
  console.log('   daily_work_data 数量:', syncData.data?.daily_work_data?.length || 0)

  console.log('\n=== 测试完成 ===')
}

testBulkImport().catch(console.error)
