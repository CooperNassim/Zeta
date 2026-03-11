const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function exportSchema() {
  try {
    console.log('开始导出数据库结构...');

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

    console.log(`找到 ${tables.length} 个表: ${tables.join(', ')}`);

    const migrationScript = [];
    migrationScript.push('-- Zeta Trading System 数据库迁移脚本');
    migrationScript.push('-- 生成时间: ' + new Date().toISOString());
    migrationScript.push('');
    migrationScript.push('-- 删除现有表（如果存在）');
    tables.forEach(table => {
      migrationScript.push(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    });
    migrationScript.push('');

    // 导出每个表的结构和数据
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
        SELECT con.conname, pg_get_constraintdef(con.oid)
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = con.connamespace
        WHERE rel.relname = $1
        AND con.contype IN ('p', 'u', 'c', 'f')
      `;
      const constraintsResult = await pool.query(constraintsQuery, [table]);

      // 获取索引
      const indexesQuery = `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = $1
        AND indexname NOT LIKE '%_pkey'
      `;
      const indexesResult = await pool.query(indexesQuery, [table]);

      // 构建CREATE TABLE语句
      migrationScript.push(`CREATE TABLE ${table} (`);

      const columnDefs = [];
      const primaryKeys = [];
      const uniqueKeys = [];

      for (const col of columnsResult.rows) {
        let colDef = `    ${col.column_name}`;

        // 数据类型
        if (col.data_type === 'character varying') {
          colDef += ` VARCHAR(${col.character_maximum_length})`;
        } else if (col.data_type === 'timestamp without time zone') {
          colDef += ` TIMESTAMP`;
        } else if (col.data_type === 'timestamp with time zone') {
          colDef += ` TIMESTAMPTZ`;
        } else {
          colDef += ` ${col.data_type.toUpperCase()}`;
        }

        // NULL约束
        colDef += col.is_nullable === 'YES' ? ' NULL' : ' NOT NULL';

        // 默认值
        if (col.column_default) {
          colDef += ` DEFAULT ${col.column_default}`;
        }

        columnDefs.push(colDef);
      }

      // 添加主键约束
      for (const con of constraintsResult.rows) {
        if (con.conname.includes('pkey')) {
          const match = con.pg_get_constraintdef.match(/\(([^)]+)\)/);
          if (match) {
            const pkColumns = match[1].split(', ').map(c => c.replace(/"/g, ''));
            migrationScript.push(`    PRIMARY KEY (${pkColumns.join(', ')}),`);
          }
        }
      }

      // 添加唯一约束
      for (const con of constraintsResult.rows) {
        if (con.conname.includes('unique')) {
          const match = con.pg_get_constraintdef.match(/\(([^)]+)\)/);
          if (match) {
            const uniqueColumns = match[1].split(', ').map(c => c.replace(/"/g, ''));
            migrationScript.push(`    UNIQUE (${uniqueColumns.join(', ')}),`);
          }
        }
      }

      // 添加列定义
      migrationScript.push(...columnDefs.map(d => d.replace(/,$/, '')));

      migrationScript.push(');');
      migrationScript.push('');

      // 添加索引
      for (const idx of indexesResult.rows) {
        migrationScript.push(idx.indexdef.replace('CREATE INDEX', `CREATE INDEX ${idx.indexname}`));
        migrationScript.push('');
      }

      // 导出数据
      const dataQuery = `SELECT * FROM ${table}`;
      const dataResult = await pool.query(dataQuery);

      if (dataResult.rows.length > 0) {
        console.log(`  导入 ${dataResult.rows.length} 条数据`);

        migrationScript.push(`-- 插入数据到 ${table}`);

        const columns = Object.keys(dataResult.rows[0]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        dataResult.rows.forEach(row => {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'string') {
              // 处理日期时间
              if (col.includes('_at') || col === 'date') {
                return `'${val}'`;
              }
              return `'${val.replace(/'/g, "''")}'`;
            }
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          });

          migrationScript.push(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`
          );
        });

        migrationScript.push('');
      }
    }

    migrationScript.push('-- ========================================');
    migrationScript.push('-- 迁移完成');
    migrationScript.push('-- ========================================');

    // 保存到文件
    const outputDir = path.join(__dirname, '../../migrations');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputFile = path.join(outputDir, `migration_${timestamp}.sql`);

    fs.writeFileSync(outputFile, migrationScript.join('\n'), 'utf8');

    console.log(`\n✅ 导出完成！`);
    console.log(`文件位置: ${outputFile}`);
    console.log(`表数量: ${tables.length}`);
    console.log(`总数据行: ${migrationScript.filter(l => l.startsWith('INSERT INTO')).length}`);

    process.exit(0);
  } catch (error) {
    console.error('导出失败:', error);
    process.exit(1);
  }
}

exportSchema();
