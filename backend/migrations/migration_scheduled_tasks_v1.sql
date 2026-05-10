-- 定时任务配置表
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL UNIQUE,     -- 任务唯一标识
  name VARCHAR(200) NOT NULL,               -- 任务名称
  cron_expression VARCHAR(100) NOT NULL,    -- cron 表达式
  trigger_type VARCHAR(50) DEFAULT 'cron',  -- 触发类型: cron, interval, manual
  status VARCHAR(20) DEFAULT 'running',     -- running, paused
  description TEXT,                         -- 任务描述
  last_run_at TIMESTAMPTZ,                  -- 上次执行时间
  last_run_status VARCHAR(20),              -- success, failed, running
  last_run_duration INTEGER,                -- 执行时长（毫秒）
  last_error TEXT,                          -- 最近错误信息
  next_run_at TIMESTAMPTZ,                  -- 下次执行时间
  metadata JSONB DEFAULT '{}',             -- 额外配置
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_task_id ON scheduled_tasks(task_id);

-- 定时任务执行历史表
CREATE TABLE IF NOT EXISTS scheduled_task_logs (
  id SERIAL PRIMARY KEY,
  task_id VARCHAR(100) NOT NULL,            -- 关联 scheduled_tasks.task_id
  status VARCHAR(20) NOT NULL,              -- success, failed, running
  started_at TIMESTAMPTZ NOT NULL,          -- 开始时间
  finished_at TIMESTAMPTZ,                  -- 结束时间
  duration INTEGER,                         -- 执行时长（毫秒）
  error_message TEXT,                       -- 错误信息
  output JSONB,                             -- 执行结果
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_task_logs_task_id ON scheduled_task_logs(task_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_task_logs_status ON scheduled_task_logs(status);
