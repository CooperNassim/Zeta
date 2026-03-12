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

async function checkDatabase() {
  console.log('=== 检查数据库中的数据 ===')

  // 获取当前数据
  const currentData = await apiCall('/api/daily_work_data')
  console.log('未删除的数据:', currentData.data?.length || 0)

  // 尝试查询已删除的数据
  try {
    const response = await fetch('http://localhost:3001/api/daily_work_data?includeDeleted=true', {
      headers: { 'Content-Type': 'application/json' }
    })
    const result = await response.json()
    console.log('所有数据（含已删除）:', result.data?.length || 0)
    if (result.data && result.data.length > 0) {
      result.data.forEach(d => {
        console.log(`  - 日期: ${d.date}, 已删除: ${d.deleted}, 删除时间: ${d.deleted_at}`)
      })
    }
  } catch (e) {
    console.log('无法查询已删除数据')
  }

  // 检查是否有特定日期的软删除数据
  console.log('\n检查特定日期的软删除数据:')
  const testDates = ['2026-03-10', '2026-03-11']
  for (const date of testDates) {
    try {
      const response = await fetch(`http://localhost:3001/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'SELECT * FROM daily_work_data WHERE date = $1',
          params: [date]
        })
      })
      const result = await response.json()
      if (result.success && result.data) {
        console.log(`  日期 ${date}:`, result.data.length > 0 ? `找到 ${result.data.length} 条记录` : '无记录')
        result.data.forEach(d => {
          console.log(`    - ID: ${d.id}, 已删除: ${d.deleted}, 删除时间: ${d.deleted_at}`)
        })
      }
    } catch (e) {
      console.log(`  查询日期 ${date} 失败:`, e.message)
    }
  }
}

checkDatabase().catch(console.error)
