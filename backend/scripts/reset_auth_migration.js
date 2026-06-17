const { pool } = require('../src/config/database');

async function resetMigration() {
  try {
    await pool.query("DELETE FROM schema_migrations WHERE filename='migration_auth_system_v1.sql'");
    console.log('已清除失败的迁移记录');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

resetMigration();
