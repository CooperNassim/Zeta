const { pool } = require('../src/config/database');

async function fixPsychologicalTables() {
  try {
    console.log('开始修复心理测试表...');

    // 1. 删除旧表
    console.log('1. 删除旧表...');
    await pool.query('DROP TABLE IF EXISTS psychological_test_indicators CASCADE');
    await pool.query('DROP TABLE IF EXISTS psychological_test_results CASCADE');
    await pool.query('DROP TABLE IF EXISTS psychological_indicators CASCADE');

    // 2. 创建心理测试结果表（使用 DATE 类型）
    console.log('2. 创建心理测试结果表...');
    await pool.query(`
      CREATE TABLE psychological_test_results (
        id SERIAL PRIMARY KEY,
        test_date DATE NOT NULL,
        scores JSON NOT NULL,
        overall_score NUMERIC,
        notes TEXT,
        deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await pool.query('CREATE INDEX psych_results_date_idx ON psychological_test_results (test_date DESC)');
    await pool.query('CREATE INDEX psych_results_created_idx ON psychological_test_results (created_at DESC)');
    await pool.query('CREATE INDEX psych_results_deleted_idx ON psychological_test_results (deleted)');

    // 3. 创建心理指标表
    console.log('3. 创建心理指标表...');
    await pool.query(`
      CREATE TABLE psychological_indicators (
        id SERIAL PRIMARY KEY,
        indicator_name VARCHAR(100) NOT NULL,
        description TEXT,
        min_score NUMERIC NOT NULL DEFAULT 0,
        max_score NUMERIC NOT NULL DEFAULT 10,
        weight NUMERIC NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        deleted BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await pool.query('CREATE INDEX psych_indicators_status_idx ON psychological_indicators (status)');
    await pool.query('CREATE INDEX psych_indicators_deleted_idx ON psychological_indicators (deleted)');

    // 4. 插入默认指标
    console.log('4. 插入默认指标...');
    await pool.query(`
      INSERT INTO psychological_indicators (id, indicator_name, description, min_score, max_score, weight, status) VALUES
      (1, '心态稳定性', '评估投资者在面对市场波动时的心理稳定性', 0, 10, 1.0, 'active'),
      (2, '风险承受能力', '评估投资者对风险的承受意愿和能力', 0, 10, 1.0, 'active'),
      (3, '决策果断性', '评估投资决策的果断程度和执行力', 0, 10, 1.0, 'active'),
      (4, '情绪控制力', '评估投资者情绪对交易决策的影响程度', 0, 10, 1.0, 'active'),
      (5, '纪律性', '评估投资者遵守交易纪律的情况', 0, 10, 1.0, 'active')
    `);

    // 5. 创建触发器
    console.log('5. 创建触发器...');
    await pool.query(`
      CREATE TRIGGER update_psychological_test_results_updated_at 
      BEFORE UPDATE ON psychological_test_results 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    await pool.query(`
      CREATE TRIGGER update_psychological_indicators_updated_at 
      BEFORE UPDATE ON psychological_indicators 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);

    // 6. 添加注释
    console.log('6. 添加注释...');
    await pool.query("COMMENT ON TABLE psychological_test_results IS '心理测试结果表 - 使用 DATE 类型存储日期，避免时区问题'");
    await pool.query("COMMENT ON COLUMN psychological_test_results.test_date IS '测试日期（DATE类型，无时区）'");
    await pool.query("COMMENT ON COLUMN psychological_test_results.scores IS '各指标分数 JSON: {1: 5, 2: 7, ...}'");
    await pool.query("COMMENT ON COLUMN psychological_test_results.overall_score IS '综合评分 (0-10分制)'");
    await pool.query("COMMENT ON TABLE psychological_indicators IS '心理指标配置表'");
    await pool.query("COMMENT ON COLUMN psychological_indicators.min_score IS '最小分数'");
    await pool.query("COMMENT ON COLUMN psychological_indicators.max_score IS '最大分数'");
    await pool.query("COMMENT ON COLUMN psychological_indicators.weight IS '权重'");

    console.log('心理测试表修复完成！');
    
    // 验证
    const count1 = await pool.query('SELECT COUNT(*) FROM psychological_test_results');
    const count2 = await pool.query('SELECT COUNT(*) FROM psychological_indicators');
    console.log(`心理测试结果记录数: ${count1.rows[0].count}`);
    console.log(`心理指标记录数: ${count2.rows[0].count}`);

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await pool.end();
  }
}

fixPsychologicalTables();
