-- Migration: 删除数据同步、定时任务和大模型配置模块相关表
-- Created: 2026-06-16
-- Description: 删除数据同步、定时任务和大模型配置模块的所有数据库表结构

-- 开始事务
BEGIN;

-- 删除数据同步相关表
DROP TABLE IF EXISTS data_sync_history CASCADE;
DROP TABLE IF EXISTS data_sources CASCADE;

-- 删除定时任务相关表
DROP TABLE IF EXISTS scheduled_task_logs CASCADE;
DROP TABLE IF EXISTS scheduled_tasks CASCADE;

-- 删除大模型配置相关表
DROP TABLE IF EXISTS llm_configs CASCADE;

-- 提交事务
COMMIT;
