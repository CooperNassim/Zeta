const cron = require('node-cron')
const { pool } = require('../config/database')

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function getNextWeekdayTime(hour, minute) {
  let next = new Date()
  next.setHours(hour, minute, 0, 0)
  if (next <= new Date() || isWeekend(next)) {
    next.setDate(next.getDate() + 1)
    while (isWeekend(next)) {
      next.setDate(next.getDate() + 1)
    }
  }
  return next
}

async function initScheduler() {
  console.log('[Scheduler] 初始化定时任务调度器...')

  // 注册 cron 任务：工作日 15:31 执行
  cron.schedule('31 15 * * 1-5', async () => {
    console.log('[Scheduler] 触发定时任务: 股票行情同步')
    const { syncTodayStocks } = require('../routes/marketData')
    await executeStockSync('stock_daily_sync', pool, syncTodayStocks)
  })

  console.log('[Scheduler] 已注册任务: stock_daily_sync (工作日 15:31)')

  // 确保默认任务记录存在
  await seedDefaultTask()
}

async function seedDefaultTask() {
  const existing = await pool.query(
    'SELECT id, status FROM scheduled_tasks WHERE task_id = $1',
    ['stock_daily_sync']
  )

  if (existing.rows.length === 0) {
    const nextRun = getNextWeekdayTime(15, 31)
    await pool.query(
      `INSERT INTO scheduled_tasks (task_id, name, cron_expression, trigger_type, status, description, next_run_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'stock_daily_sync',
        '股票行情每日同步',
        '31 15 * * 1-5',
        'cron',
        'running',
        '每个交易日 15:31 自动同步当日A股行情数据（Tushare + AKShare）',
        nextRun.toISOString()
      ]
    )
    console.log('[Scheduler] 已创建默认任务: stock_daily_sync')
  }
}

async function executeStockSync(taskId, dbPool, syncFunc) {
  const logId = await createLog(taskId, 'running', dbPool)
  const startTime = Date.now()

  try {
    const result = await syncFunc(dbPool)
    const duration = Date.now() - startTime
    const nextRun = getNextWeekdayTime(15, 31)

    await finishLog(logId, 'success', duration, result, null, dbPool)
    await updateTaskResult(taskId, 'success', duration, nextRun, null, dbPool)

    console.log(`[Scheduler] 任务完成: ${taskId}, 耗时 ${duration}ms`)
  } catch (err) {
    const duration = Date.now() - startTime
    const nextRun = getNextWeekdayTime(15, 31)

    await finishLog(logId, 'failed', duration, null, err.message, dbPool)
    await updateTaskResult(taskId, 'failed', duration, nextRun, err.message, dbPool)
    console.error(`[Scheduler] 任务失败: ${taskId}`, err.message)
  }
}

async function createLog(taskId, status, dbPool) {
  const result = await dbPool.query(
    `INSERT INTO scheduled_task_logs (task_id, status, started_at)
     VALUES ($1, $2, NOW()) RETURNING id`,
    [taskId, status]
  )
  return result.rows[0].id
}

async function finishLog(logId, status, duration, output, errorMessage, dbPool) {
  await dbPool.query(
    `UPDATE scheduled_task_logs
     SET status = $1, finished_at = NOW(), duration = $2, output = $3, error_message = $4
     WHERE id = $5`,
    [status, duration, output ? JSON.stringify(output) : null, errorMessage, logId]
  )
}

async function updateTaskResult(taskId, status, duration, nextRun, errorMessage, dbPool) {
  await dbPool.query(
    `UPDATE scheduled_tasks
     SET last_run_at = NOW(),
         last_run_status = $1,
         last_run_duration = $2,
         last_error = $3,
         next_run_at = $4,
         updated_at = NOW()
     WHERE task_id = $5`,
    [status, duration, errorMessage, nextRun.toISOString(), taskId]
  )
}

module.exports = {
  initScheduler,
  seedDefaultTask,
  getNextWeekdayTime,
  executeStockSync
}
