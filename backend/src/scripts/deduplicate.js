const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'zeta',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
})

async function deduplicateAll() {
  const client = await pool.connect()
  try {
    console.log('=== 开始清理重复数据 ===')

    // 1. 先查看日期格式分布
    console.log('\n--- 日期格式分布 ---')
    const formatDist = await client.query(`
      SELECT 
        CASE 
          WHEN trade_date ~ '^[0-9]{8}$' THEN 'YYYYMMDD'
          WHEN trade_date LIKE '____-__-__' THEN 'YYYY-MM-DD'
          ELSE 'OTHER: ' || SUBSTRING(trade_date, 1, 20)
        END as fmt,
        COUNT(*) as cnt
      FROM stock_daily
      GROUP BY fmt
      ORDER BY cnt DESC
    `)
    formatDist.rows.forEach(r => {
      console.log(`  ${r.fmt}: ${r.cnt} 条`)
    })

    // 2. 检查同一股票、同一天（归一化后）的重复情况
    console.log('\n--- 检查归一化后的重复 ---')
    const dupCheck = await client.query(`
      SELECT 
        symbol,
        TO_CHAR(TO_DATE(trade_date, 'YYYYMMDD'), 'YYYY-MM-DD') as norm_date,
        COUNT(*) as cnt
      FROM stock_daily
      GROUP BY symbol, TO_CHAR(TO_DATE(trade_date, 'YYYYMMDD'), 'YYYY-MM-DD')
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC
      LIMIT 10
    `)
    if (dupCheck.rows.length > 0) {
      console.log('发现重复数据:')
      dupCheck.rows.forEach(r => {
        console.log(`  ${r.symbol} / ${r.norm_date}: ${r.cnt} 条`)
      })
    } else {
      console.log('未发现重复数据')
    }

    // 3. 统一日期格式为 YYYYMMDD（先规范化格式）
    console.log('\n--- 统一日期格式 ---')
    const normalizeResult = await client.query(`
      UPDATE stock_daily
      SET trade_date = TO_CHAR(TO_DATE(trade_date, 'YYYYMMDD'), 'YYYYMMDD')
      WHERE trade_date !~ '^[0-9]{8}$'
    `)
    console.log(`已规范化 ${normalizeResult.rowCount} 条日期格式`)

    // 4. 清理重复数据：保留每个 (symbol, trade_date) id 最大的一条
    console.log('\n--- 清理重复数据 ---')
    const dedupResult = await client.query(`
      WITH ranked AS (
        SELECT id, symbol, trade_date,
          ROW_NUMBER() OVER (PARTITION BY symbol, trade_date ORDER BY id DESC) as rn
        FROM stock_daily
      )
      DELETE FROM stock_daily
      WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
    `)
    console.log(`已删除 ${dedupResult.rowCount} 条重复记录`)

    // 5. 验证清理结果
    const verifyDup = await client.query(`
      SELECT COUNT(*) as dup_count FROM (
        SELECT symbol, trade_date FROM stock_daily
        GROUP BY symbol, trade_date HAVING COUNT(*) > 1
      ) t
    `)
    console.log(`\n验证: 剩余重复记录组数 = ${verifyDup.rows[0].dup_count}`)

    const totalAfter = await client.query('SELECT COUNT(*) as total FROM stock_daily')
    console.log(`stock_daily 总记录数: ${totalAfter.rows[0].total}`)

    // 6. 同样清理 stock_indicators
    console.log('\n--- 清理 stock_indicators 重复数据 ---')
    const indNormalize = await client.query(`
      UPDATE stock_indicators
      SET trade_date = TO_CHAR(TO_DATE(trade_date, 'YYYYMMDD'), 'YYYYMMDD')
      WHERE trade_date !~ '^[0-9]{8}$'
    `)
    console.log(`已规范化 ${indNormalize.rowCount} 条日期格式`)

    const indDedup = await client.query(`
      WITH ranked AS (
        SELECT id, symbol, trade_date, period,
          ROW_NUMBER() OVER (PARTITION BY symbol, trade_date, period ORDER BY id DESC) as rn
        FROM stock_indicators
      )
      DELETE FROM stock_indicators
      WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
    `)
    console.log(`已删除 ${indDedup.rowCount} 条重复记录`)

    console.log('\n=== 清理完成 ===')
  } catch (err) {
    console.error('清理失败:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

deduplicateAll()
