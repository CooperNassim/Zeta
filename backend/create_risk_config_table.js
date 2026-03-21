const { pool } = require('./src/config/database');

async function createRiskConfigTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 检查表是否存在
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'risk_config'
      )
    `);

    if (checkResult.rows[0].exists) {
      console.log('risk_config 表已存在');
      return;
    }

    // 创建表
    await client.query(`
      CREATE TABLE risk_config (
          id SERIAL PRIMARY KEY,
          account_type VARCHAR(20) NOT NULL DEFAULT 'real',
          total_risk_percent NUMERIC(5, 2) NOT NULL DEFAULT 6,
          single_risk_percent NUMERIC(5, 2) NOT NULL DEFAULT 2,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT unique_account_type UNIQUE (account_type)
      )
    `);

    // 创建索引
    await client.query(`
      CREATE INDEX idx_risk_config_account_type ON risk_config (account_type)
    `);

    // 创建 updated_at 触发器（如果不存在）
    const triggerExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'update_risk_config_updated_at'
      )
    `);

    if (!triggerExists.rows[0].exists) {
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_risk_config_updated_at
            BEFORE UPDATE ON risk_config
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);
    }

    // 插入默认配置
    await client.query(`
      INSERT INTO risk_config (account_type, total_risk_percent, single_risk_percent)
      VALUES ('real', 6, 2), ('virtual', 6, 2)
      ON CONFLICT (account_type) DO NOTHING
    `);

    await client.query('COMMIT');

    console.log('risk_config 表创建成功!');

    // 验证数据
    const verifyResult = await client.query('SELECT * FROM risk_config');
    console.log('验证数据:', verifyResult.rows);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('创建 risk_config 表失败:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

createRiskConfigTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
