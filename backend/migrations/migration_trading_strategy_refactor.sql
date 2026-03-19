-- 交易策略表重构迁移脚本
-- 生成时间: 2026-03-19
-- 参考: daily_work_data 表规范

-- 删除旧的表
DROP TABLE IF EXISTS trading_strategies CASCADE;
DROP TABLE IF EXISTS strategy_records CASCADE;

-- ========================================
-- 表: trading_strategies (交易策略主表)
-- ========================================
CREATE TABLE trading_strategies (
    id SERIAL PRIMARY KEY,
    -- 基础信息
    strategy_type VARCHAR(20) NOT NULL,  -- 策略类型: '买入' | '卖出'
    name VARCHAR(200) NOT NULL,          -- 策略名称

    -- 评估标准 (参考每日功课的TEXT字段存储方式)
    eval_standard_1 TEXT NULL,            -- 评估标准Ⅰ
    eval_standard_2 TEXT NULL,            -- 评估标准Ⅱ
    eval_standard_3 TEXT NULL,            -- 评估标准Ⅲ
    eval_standard_4 TEXT NULL,            -- 评估标准Ⅳ
    eval_standard_5 TEXT NULL,            -- 评估标准Ⅴ

    -- 状态管理 (参考 daily_work_data 的 deleted 模式)
    status VARCHAR(20) NOT NULL DEFAULT '启用',  -- 状态: '启用' | '停用'

    -- 软删除字段
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ NULL,

    -- 时间戳 (统一使用 TIMESTAMPTZ)
    created_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_trading_strategies_type ON trading_strategies (strategy_type);
CREATE INDEX idx_trading_strategies_status ON trading_strategies (status);
CREATE INDEX idx_trading_strategies_deleted ON trading_strategies (deleted);
CREATE INDEX idx_trading_strategies_created ON trading_strategies (created_at DESC);

-- 插入示例数据
INSERT INTO trading_strategies (id, strategy_type, name, eval_standard_1, eval_standard_2, eval_standard_3, eval_standard_4, eval_standard_5, status) VALUES
(1, '买入', '趋势突破策略', '指标：0=突破阻力位；1=放量确认；2=回踩不破；', '指标：0=MACD金叉；1=RSI强势；2=KDJ超买；', '指标：0=均线多头；1=趋势向上；2=量价配合；', '指标：0=情绪指数高；1=资金流入；2=北向资金增；', '指标：0=盈亏比>2；1=止损<3%；2=仓位<30%；', '启用'),
(2, '买入', '回调买入策略', '指标：0=回踩支撑位；1=企稳迹象；2=缩量调整；', '指标：0=MACD底背离；1=RSI超卖；2=KDJ金叉；', '指标：0=均线支撑；1=趋势未破；2=量能萎缩；', '指标：0=恐慌情绪；1=抄底资金；2=北向资金入场；', '指标：0=盈亏比>3；1=止损<2%；2=仓位<40%；', '启用'),
(3, '买入', '低吸策略', '指标：0=超跌反弹；1=底部信号；2=技术背离；', '指标：0=MACD绿柱缩短；1=RSI<30；2=KDJ低位；', '指标：0=长期均线支撑；1=下跌趋势减缓；2=成交量极低；', '指标：0=极度恐慌；1=机构抄底；2=外资大单；', '指标：0=盈亏比>4；1=止损<2%；2=仓位<20%；', '停用'),
(4, '卖出', '止盈策略', '指标：0=盈利达标；1=加速上涨；2=量能放大；', '指标：0=MACD顶背离；1=RSI>70；2=KDJ死叉；', '指标：0=跌破均线；1=趋势转弱；2=量能萎缩；', '指标：0=情绪过热；1=获利盘涌出；2=北向资金流出；', '指标：0=收益锁定；1=止盈线触发；2=分批止盈；', '启用'),
(5, '卖出', '止损策略', '指标：0=跌破止损位；1=放量破位；2=反抽无力；', '指标：0=MACD死叉；1=RSI弱势；2=KDJ高位；', '指标：0=均线空头；1=趋势破坏；2=量能放大；', '指标：0=情绪恐慌；1=恐慌性抛售；2=外资大幅流出；', '指标：0=亏损控制；1=止损线触发；2=坚决止损；', '启用'),
(6, '卖出', '风险控制策略', '指标：0=风险过高；1仓位过大；2=波动剧烈；', '指标：0=系统性风险；1=黑天鹅事件；2=政策利空；', '指标：0=技术破位；1=支撑失效；2=反弹无力；', '指标：0=市场恐慌；1=流动性危机；2=全面下跌；', '指标：0=保护本金；1.降低仓位；2.空仓观望；', '停用');

-- ========================================
-- 更新 updated_at 触发器 (与 daily_work_data 一致)
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trading_strategies_updated_at
    BEFORE UPDATE ON trading_strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 添加注释
-- ========================================
COMMENT ON TABLE trading_strategies IS '交易策略表';
COMMENT ON COLUMN trading_strategies.id IS '策略ID';
COMMENT ON COLUMN trading_strategies.strategy_type IS '策略类型: 买入/卖出';
COMMENT ON COLUMN trading_strategies.name IS '策略名称';
COMMENT ON COLUMN trading_strategies.eval_standard_1 IS '评估标准Ⅰ';
COMMENT ON COLUMN trading_strategies.eval_standard_2 IS '评估标准Ⅱ';
COMMENT ON COLUMN trading_strategies.eval_standard_3 IS '评估标准Ⅲ';
COMMENT ON COLUMN trading_strategies.eval_standard_4 IS '评估标准Ⅳ';
COMMENT ON COLUMN trading_strategies.eval_standard_5 IS '评估标准Ⅴ';
COMMENT ON COLUMN trading_strategies.status IS '状态: 启用/停用';
COMMENT ON COLUMN trading_strategies.deleted IS '软删除标记';
COMMENT ON COLUMN trading_strategies.deleted_at IS '删除时间';
COMMENT ON COLUMN trading_strategies.created_at IS '创建时间';
COMMENT ON COLUMN trading_strategies.updated_at IS '更新时间';
