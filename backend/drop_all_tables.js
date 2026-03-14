const { Client } = require('pg');

async function dropAllTables() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'zeta_trading',
    user: 'postgres',
    password: '你的密码'  // 替换为你的密码
  });

  try {
    await client.connect();
    console.log('✅ 数据库连接成功');

    // 获取所有表
    const tablesResult = await client.query(\
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    \);

    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(\找到 \ 个表\);

    if (tables.length === 0) {
      console.log('数据库已经是空的');
      return;
    }

    console.log('开始删除所有表...');
    
    for (const table of tables) {
      try {
        await client.query(\DROP TABLE IF EXISTS "\" CASCADE\);
        console.log(\✅ 已删除表: \\);
      } catch (err) {
        console.error(\❌ 删除表 \ 失败:\, err.message);
      }
    }

    // 删除所有序列
    const sequencesResult = await client.query(\
      SELECT sequencename 
      FROM pg_sequences 
      WHERE schemaname = 'public'
    \);

    const sequences = sequencesResult.rows.map(row => row.sequencename);
    for (const seq of sequences) {
      try {
        await client.query(\DROP SEQUENCE IF EXISTS "\" CASCADE\);
        console.log(\✅ 已删除序列: \\);
      } catch (err) {
        console.log(\ℹ️ 删除序列 \ 失败:\, err.message);
      }
    }

    console.log('\n✅ 所有表已删除，数据库现在是空的');
  } catch (err) {
    console.error('❌ 删除表失败:', err);
  } finally {
    await client.end();
  }
}

dropAllTables();
