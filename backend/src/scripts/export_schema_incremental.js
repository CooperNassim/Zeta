const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function exportIncrementalMigration() {
  try {
    console.log('开始导出增量迁移（仅表结构）...');

    // 获取所有表名
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows.map(r => r.table_name);

    console.log(`找到 ${tables.length} 个表`);

    const migrationScript = [];
    migrationScript.push('-- Zeta Trading System 增量迁移脚本');
    migrationScript.push('-- 仅包含表结构，不包含数据');
    migrationScript.push('-- 生成时间: ' + new Date().toISOString());
    migrationScript.push('');
    migrationScript.push('-- ========================================');
    migrationScript.push('-- 说明：此脚本仅更新表结构');
    migrationScript.push('-- 如果需要修改已有列，请手动调整语句');
    migrationScript.push('-- ========================================');
    migrationScript.push('');

    // 导出每个表的结构（不含数据）
    for (const table of tables) {
      console.log(`处理表: ${table}`);

      migrationScript.push(`-- ========================================`);
      migrationScript.push(`-- 表: ${table}`);
      migrationScript.push(`-- ========================================`);

      // 获取表结构
      const columnsQuery = `
        SELECT column_name, data_type, character_maximum_length,
               is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `;
      const columnsResult = await pool.query(columnsQuery, [table]);

      // 获取约束信息
      const constraintsQuery = `
        SELECT con.conname, pg_get_constraintdef(con.oid), con.contype
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = con.connamespace
        WHERE rel.relname = $1
        AND con.contype IN ('p', 'u')
      `;
      const constraintsResult = await pool.query(constraintsQuery, [table]);

      // 构建ALTER TABLE语句（增量更新）
      migrationScript.push(`-- 更新表 ${table} 的结构`);
      migrationScript.push('-- 注意：如果表已存在，使用 ALTER TABLE 添加新列或修改现有列');

      // 检查表是否存在（通过列名判断）
      if (columnsResult.rows.length > 0) {
        migrationScript.push('-- 方式1：重建表（谨慎使用，会删除数据）');
        migrationScript.push('-- DROP TABLE IF EXISTS ' + table + ' CASCADE;');
        migrationScript.push('--');

        migrationScript.push('-- 方式2：增量添加新列（推荐）');
        migrationScript.push('-- 检查是否有新列需要添加');

        // 检查每个列
        for (const col of columnsResult.rows) {
          migrationScript.push(`-- 列: ${col.column_name} (${col.data_type})`);
          let alterSql = `-- ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col.column_name}`;

          if (col.data_type === 'character varying') {
            alterSql += ` VARCHAR(${col.character_maximum_length})`;
          } else if (col.data_type === 'timestamp without time zone') {
            alterSql += ` TIMESTAMP`;
          } else if (col.data_type === 'timestamp with time zone') {
            alterSql += ` TIMESTAMPTZ`;
          } else {
            alterSql += ` ${col.data_type.toUpperCase()}`;
          }

          alterSql += col.is_nullable === 'YES' ? '' : ' NOT NULL';

          if (col.column_default) {
            alterSql += ` DEFAULT ${col.column_default}`;
          }

          migrationScript.push(alterSql + ';');
        }

        migrationScript.push('');

        // 添加约束
        for (const con of constraintsResult.rows) {
          if (con.contype === 'u') {
            const match = con.pg_get_constraintdef.match(/\(([^)]+)\)/);
            if (match) {
              const uniqueColumns = match[1].split(', ').map(c => c.replace(/"/g, ''));
              migrationScript.push(`-- ALTER TABLE ${table} ADD CONSTRAINT ${con.conname} UNIQUE (${uniqueColumns.join(', ')});`);
            }
          }
        }

        migrationScript.push('');
      }
    }

    // 保存到文件
    const outputDir = path.join(__dirname, '../../migrations');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputFile = path.join(outputDir, `migration_incremental_${timestamp}.sql`);

    fs.writeFileSync(outputFile, migrationScript.join('\n'), 'utf8');

    console.log(`\n✅ 增量迁移文件生成完成！`);
    console.log(`文件位置: ${outputFile}`);
    console.log(`\n使用方法：`);
    console.log(`1. 打开文件，取消需要的ALTER TABLE语句的注释`);
    console.log(`2. 在目标数据库执行: psql -U postgres -d zeta_trading -f ${path.basename(outputFile)}`);

    process.exit(0);
  } catch (error) {
    console.error('导出失败:', error);
    process.exit(1);
  }
}

exportIncrementalMigration();
