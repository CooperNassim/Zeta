/**
 * 异步任务管理器
 * 支持进度跟踪、停止、恢复等功能
 */

const tasks = new Map();

/**
 * 创建任务
 */
function createTask(taskId, metadata = {}) {
  tasks.set(taskId, {
    id: taskId,
    status: 'running', // running, completed, failed, stopped
    progress: 0, // 0-100
    total: 0,
    processed: 0,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    startTime: Date.now(),
    endTime: null,
    error: null,
    metadata,
    stopRequested: false,
  });
  return tasks.get(taskId);
}

/**
 * 获取任务状态
 */
function getTask(taskId) {
  return tasks.get(taskId);
}

/**
 * 更新任务进度
 */
function updateTask(taskId, updates) {
  const task = tasks.get(taskId);
  if (!task) return;
  
  Object.assign(task, updates);
  
  // 自动计算进度百分比
  if (task.total > 0 && task.processed !== undefined) {
    task.progress = Math.round((task.processed / task.total) * 100);
  }
}

/**
 * 标记任务完成
 */
function completeTask(taskId, result) {
  const task = tasks.get(taskId);
  if (!task) return;
  
  task.status = 'completed';
  task.endTime = Date.now();
  task.duration = task.endTime - task.startTime;
  Object.assign(task, result);
}

/**
 * 标记任务失败
 */
function failTask(taskId, error) {
  const task = tasks.get(taskId);
  if (!task) return;
  
  task.status = 'failed';
  task.endTime = Date.now();
  task.duration = task.endTime - task.startTime;
  task.error = error;
}

/**
 * 请求停止任务
 */
function requestStopTask(taskId) {
  const task = tasks.get(taskId);
  if (!task || task.status !== 'running') return false;
  
  task.stopRequested = true;
  return true;
}

/**
 * 检查是否请求停止
 */
function isStopRequested(taskId) {
  const task = tasks.get(taskId);
  return task && task.stopRequested;
}

/**
 * 清理已完成的任务（保留最近1小时的）
 */
function cleanupOldTasks() {
  const oneHourAgo = Date.now() - 3600000;
  for (const [id, task] of tasks.entries()) {
    if (task.endTime && task.endTime < oneHourAgo) {
      tasks.delete(id);
    }
  }
}

/**
 * 获取所有活跃任务
 */
function getActiveTasks() {
  const active = [];
  for (const [, task] of tasks.entries()) {
    if (task.status === 'running') {
      active.push({
        id: task.id,
        status: task.status,
        progress: task.progress,
        total: task.total,
        processed: task.processed,
        successCount: task.successCount,
        failedCount: task.failedCount,
        skippedCount: task.skippedCount,
        startTime: task.startTime,
        metadata: task.metadata,
      });
    }
  }
  return active;
}

// 每10分钟清理一次旧任务
setInterval(cleanupOldTasks, 600000);

module.exports = {
  createTask,
  getTask,
  updateTask,
  completeTask,
  failTask,
  requestStopTask,
  isStopRequested,
  getActiveTasks,
  cleanupOldTasks,
};
